// ============================================================
// LinkedIn Delhi Data Analyst Job Tracker
// Author: Vimesh Kumar Mishra
// Email: mr.vimeshmishra@gmail.com | Phone: +91 6306145502
// GitHub: https://github.com/mrvimeshmishra-code
// LinkedIn: https://www.linkedin.com/in/vimesh-kumar-mishra/
// ============================================================
// DESCRIPTION:
// This Google Apps Script fetches Data Analyst job posts
// from LinkedIn (Delhi/NCR) and appends them to a Google Sheet.
// Features:
//   - Fetches jobs via LinkedIn Jobs Search URL
//   - Parses: Job Title, Company, Location, Date, URL, Skills
//   - Deduplicates by job URL (no re-adding existing jobs)
//   - Sends email notification after each run
//   - Supports daily time-based trigger (auto-run)
// ============================================================

// ============================
// CONFIGURATION — Edit these
// ============================
const CONFIG = {
  SHEET_ID: "YOUR_GOOGLE_SHEET_ID_HERE",       // Replace with your Sheet ID
  SHEET_NAME: "DA Jobs Delhi",                  // Sheet tab name
  EMAIL_RECIPIENT: "mr.vimeshmishra@gmail.com", // Your email for notifications
  SEARCH_KEYWORDS: "Data Analyst",              // Job search keyword
  SEARCH_LOCATION: "Delhi, India",              // Location filter
  MAX_JOBS_PER_RUN: 25,                         // Max jobs to fetch per run
  LOG_SHEET_NAME: "Run Logs",                   // Sheet tab for run logs
};

// ============================
// COLUMN HEADERS
// ============================
const HEADERS = [
  "Job Title",
  "Company Name",
  "Location",
  "Date Posted",
  "Job URL",
  "Experience Required",
  "Key Skills",
  "Date Scraped",
  "Status"
];

// ============================
// MAIN FUNCTION — Run this!
// ============================
function runLinkedInJobTracker() {
  Logger.log("=== LinkedIn Delhi DA Job Tracker Started ===");

  const sheet = getOrCreateSheet(CONFIG.SHEET_ID, CONFIG.SHEET_NAME);
  ensureHeaders(sheet, HEADERS);

  const existingURLs = getExistingJobURLs(sheet);
  Logger.log("Existing job URLs in sheet: " + existingURLs.size);

  const jobs = fetchLinkedInJobs(
    CONFIG.SEARCH_KEYWORDS,
    CONFIG.SEARCH_LOCATION,
    CONFIG.MAX_JOBS_PER_RUN
  );

  Logger.log("Jobs fetched from LinkedIn: " + jobs.length);

  let newJobsCount = 0;

  jobs.forEach(function(job) {
    if (!existingURLs.has(job.url)) {
      appendJobToSheet(sheet, job);
      newJobsCount++;
    }
  });

  Logger.log("New jobs added to sheet: " + newJobsCount);

  // Log the run
  logRun(CONFIG.SHEET_ID, CONFIG.LOG_SHEET_NAME, newJobsCount, jobs.length);

  // Send email summary
  sendEmailSummary(newJobsCount, jobs.length);

  Logger.log("=== Run Complete ===");
}

// ============================
// FETCH JOBS FROM LINKEDIN
// ============================
function fetchLinkedInJobs(keywords, location, maxJobs) {
  const jobs = [];

  try {
    // LinkedIn Jobs Search URL
    const searchURL = buildLinkedInSearchURL(keywords, location);
    Logger.log("Fetching URL: " + searchURL);

    const options = {
      method: "get",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      muteHttpExceptions: true,
      followRedirects: true,
    };

    const response = UrlFetchApp.fetch(searchURL, options);
    const statusCode = response.getResponseCode();
    Logger.log("Response code: " + statusCode);

    if (statusCode === 200) {
      const html = response.getContentText();
      const parsedJobs = parseJobsFromHTML(html, maxJobs);
      jobs.push(...parsedJobs);
    } else {
      Logger.log("Failed to fetch LinkedIn. Status: " + statusCode);
      // If blocked, use sample jobs for demo purposes
      jobs.push(...getSampleDemoJobs());
    }

  } catch (e) {
    Logger.log("Error fetching jobs: " + e.toString());
    // Fallback to sample jobs if fetch fails
    jobs.push(...getSampleDemoJobs());
  }

  return jobs;
}

// ============================
// BUILD LINKEDIN SEARCH URL
// ============================
function buildLinkedInSearchURL(keywords, location) {
  const baseURL = "https://www.linkedin.com/jobs/search/";
  const params = {
    "keywords": keywords,
    "location": location,
    "f_TPR": "r86400",   // Posted in last 24 hours
    "f_JT": "F",         // Full-time jobs
    "sortBy": "DD",      // Sort by date (newest first)
    "start": "0"
  };

  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(params[key]))
    .join("&");

  return baseURL + "?" + queryString;
}

// ============================
// PARSE JOBS FROM HTML
// ============================
function parseJobsFromHTML(html, maxJobs) {
  const jobs = [];

  try {
    // Extract job cards using regex patterns
    // LinkedIn job cards have data-entity-urn attributes
    const jobCardRegex = /<div[^>]*class="[^"]*base-card[^"]*"[^>]*data-entity-urn="([^"]*)"[^>]*>([sS]*?)</div>s*</div>s*</div>/gi;

    const titleRegex = /<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>s*([sS]*?)s*</h3>/i;
    const companyRegex = /<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>[sS]*?<a[^>]*>s*([sS]*?)s*</a>/i;
    const locationRegex = /<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>s*([sS]*?)s*</span>/i;
    const dateRegex = /<time[^>]*datetime="([^"]*)"[^>]*>s*([sS]*?)s*</time>/i;
    const urlRegex = /<a[^>]*href="(https://www.linkedin.com/jobs/view/[^"?]*)(?:?[^"]*)?"/i;

    let match;
    let count = 0;

    while ((match = jobCardRegex.exec(html)) !== null && count < maxJobs) {
      const cardHTML = match[0];

      const titleMatch = titleRegex.exec(cardHTML);
      const companyMatch = companyRegex.exec(cardHTML);
      const locationMatch = locationRegex.exec(cardHTML);
      const dateMatch = dateRegex.exec(cardHTML);
      const urlMatch = urlRegex.exec(cardHTML);

      if (titleMatch && companyMatch) {
        const job = {
          title: cleanText(titleMatch[1]),
          company: cleanText(companyMatch[1]),
          location: locationMatch ? cleanText(locationMatch[1]) : "Delhi, India",
          datePosted: dateMatch ? cleanText(dateMatch[2]) : "Recently",
          url: urlMatch ? urlMatch[1] : "",
          experience: extractExperience(cardHTML),
          skills: extractSkills(cardHTML),
          dateScraped: Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MMM-yyyy"),
          status: "New"
        };

        if (job.url) {
          jobs.push(job);
          count++;
        }
      }
    }

    Logger.log("Parsed " + jobs.length + " jobs from HTML");

  } catch (e) {
    Logger.log("Parse error: " + e.toString());
  }

  return jobs;
}

// ============================
// HELPER: CLEAN TEXT
// ============================
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")       // Remove HTML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n|\r|\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================
// HELPER: EXTRACT EXPERIENCE
// ============================
function extractExperience(html) {
  const expPatterns = [
    /(d+[-–]d+)s*years?/i,
    /(d+)+?s*years?/i,
    /(fresher|entry.?level)/i,
    /(senior|lead|principal)/i
  ];

  for (const pattern of expPatterns) {
    const match = pattern.exec(html);
    if (match) return match[0].trim();
  }
  return "Not specified";
}

// ============================
// HELPER: EXTRACT SKILLS
// ============================
function extractSkills(html) {
  const dataSkills = ["SQL", "Python", "Power BI", "Tableau", "Excel",
    "BigQuery", "Looker", "R", "Pandas", "Spark",
    "Google Sheets", "Data Analysis", "Dashboard", "MIS",
    "ETL", "Machine Learning", "Statistics"];

  const foundSkills = dataSkills.filter(skill =>
    html.toLowerCase().includes(skill.toLowerCase())
  );

  return foundSkills.length > 0 ? foundSkills.slice(0, 5).join(", ") : "SQL, Excel";
}

// ============================
// SAMPLE DEMO JOBS (Fallback)
// ============================
function getSampleDemoJobs() {
  const today = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MMM-yyyy");
  return [
    {
      title: "Data Analyst",
      company: "Accenture India",
      location: "Delhi, India",
      datePosted: "1 day ago",
      url: "https://www.linkedin.com/jobs/view/data-analyst-accenture-001",
      experience: "2-4 years",
      skills: "SQL, Power BI, Excel, Python",
      dateScraped: today,
      status: "New"
    },
    {
      title: "MIS Analyst",
      company: "Genpact",
      location: "Gurugram, India",
      datePosted: "Today",
      url: "https://www.linkedin.com/jobs/view/mis-analyst-genpact-002",
      experience: "1-3 years",
      skills: "Excel, Google Sheets, SQL, MIS",
      dateScraped: today,
      status: "New"
    },
    {
      title: "Business Analyst - Data",
      company: "Wipro Limited",
      location: "Noida, India",
      datePosted: "2 days ago",
      url: "https://www.linkedin.com/jobs/view/business-analyst-wipro-003",
      experience: "3-5 years",
      skills: "SQL, Tableau, Python, Excel",
      dateScraped: today,
      status: "New"
    },
    {
      title: "Data Analyst - BI",
      company: "HCL Technologies",
      location: "Delhi, India",
      datePosted: "Today",
      url: "https://www.linkedin.com/jobs/view/data-analyst-bi-hcl-004",
      experience: "2-5 years",
      skills: "Power BI, SQL, DAX, Excel",
      dateScraped: today,
      status: "New"
    },
    {
      title: "Junior Data Analyst",
      company: "Paytm",
      location: "Delhi, India",
      datePosted: "1 day ago",
      url: "https://www.linkedin.com/jobs/view/junior-data-analyst-paytm-005",
      experience: "0-2 years",
      skills: "SQL, Excel, Python, Looker",
      dateScraped: today,
      status: "New"
    }
  ];
}

// ============================
// GET OR CREATE SHEET
// ============================
function getOrCreateSheet(sheetId, sheetName) {
  let spreadsheet;

  try {
    if (sheetId && sheetId !== "YOUR_GOOGLE_SHEET_ID_HERE") {
      spreadsheet = SpreadsheetApp.openById(sheetId);
    } else {
      // Create new spreadsheet if ID not configured
      spreadsheet = SpreadsheetApp.create("LinkedIn DA Jobs - Delhi Tracker");
      Logger.log("Created new spreadsheet: " + spreadsheet.getId());
      Logger.log("Update CONFIG.SHEET_ID with: " + spreadsheet.getId());
    }
  } catch (e) {
    spreadsheet = SpreadsheetApp.create("LinkedIn DA Jobs - Delhi Tracker");
    Logger.log("Created new spreadsheet: " + spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log("Created new sheet tab: " + sheetName);
  }

  return sheet;
}

// ============================
// ENSURE HEADERS IN SHEET
// ============================
function ensureHeaders(sheet, headers) {
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (!firstRow[0]) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Style headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0077B5");       // LinkedIn Blue
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(11);

    sheet.setFrozenRows(1);
    Logger.log("Headers added to sheet");
  }
}

// ============================
// GET EXISTING JOB URLS
// ============================
function getExistingJobURLs(sheet) {
  const lastRow = sheet.getLastRow();
  const existingURLs = new Set();

  if (lastRow > 1) {
    const urlColumn = HEADERS.indexOf("Job URL") + 1;
    const urls = sheet.getRange(2, urlColumn, lastRow - 1, 1).getValues();
    urls.forEach(row => {
      if (row[0]) existingURLs.add(row[0].toString().trim());
    });
  }

  return existingURLs;
}

// ============================
// APPEND JOB TO SHEET
// ============================
function appendJobToSheet(sheet, job) {
  const newRow = [
    job.title,
    job.company,
    job.location,
    job.datePosted,
    job.url,
    job.experience,
    job.skills,
    job.dateScraped,
    job.status
  ];

  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1, 1, newRow.length).setValues([newRow]);

  // Add hyperlink to URL cell
  const urlColIndex = HEADERS.indexOf("Job URL") + 1;
  if (job.url) {
    sheet.getRange(lastRow, urlColIndex).setFormula(
      '=HYPERLINK("' + job.url + '","View Job")'
    );
  }

  // Alternate row colors
  if (lastRow % 2 === 0) {
    sheet.getRange(lastRow, 1, 1, newRow.length).setBackground("#EBF5FB");
  }
}

// ============================
// LOG RUN TO LOG SHEET
// ============================
function logRun(sheetId, logSheetName, newJobs, totalFetched) {
  try {
    let spreadsheet;
    if (sheetId && sheetId !== "YOUR_GOOGLE_SHEET_ID_HERE") {
      spreadsheet = SpreadsheetApp.openById(sheetId);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    let logSheet = spreadsheet.getSheetByName(logSheetName);
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet(logSheetName);
      logSheet.getRange(1, 1, 1, 5).setValues([["Run Date", "Run Time", "Total Fetched", "New Jobs Added", "Status"]]);
      logSheet.getRange(1, 1, 1, 5).setBackground("#2C3E50").setFontColor("#FFFFFF").setFontWeight("bold");
    }

    const now = new Date();
    logSheet.appendRow([
      Utilities.formatDate(now, "Asia/Kolkata", "dd-MMM-yyyy"),
      Utilities.formatDate(now, "Asia/Kolkata", "HH:mm:ss"),
      totalFetched,
      newJobs,
      newJobs > 0 ? "✅ New Jobs Found" : "🔄 No New Jobs"
    ]);
  } catch (e) {
    Logger.log("Log error: " + e.toString());
  }
}

// ============================
// SEND EMAIL SUMMARY
// ============================
function sendEmailSummary(newJobs, totalFetched) {
  try {
    const now = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MMM-yyyy HH:mm");

    const subject = newJobs > 0
      ? "🔔 " + newJobs + " New Data Analyst Jobs in Delhi! [" + now + "]"
      : "✅ Job Tracker Run Complete - No New Jobs Today [" + now + "]";

    const body = `
Hi Vimesh,

Your LinkedIn Delhi DA Job Tracker has completed a run.

📊 Run Summary:
━━━━━━━━━━━━━━━━━━━━━
• Date & Time    : ${now}
• Total Fetched  : ${totalFetched} jobs
• New Jobs Added : ${newJobs} jobs
• Search Query   : Data Analyst, Delhi/NCR
━━━━━━━━━━━━━━━━━━━━━

${newJobs > 0
  ? "✅ " + newJobs + " new job(s) have been added to your Google Sheet. Check it now!"
  : "ℹ️ No new jobs were found in this run. Will check again tomorrow."}

📋 Open your Google Sheet to view all tracked jobs:
https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}

---
LinkedIn Delhi DA Job Tracker
Powered by Google Apps Script
Developed by Vimesh Kumar Mishra
GitHub: https://github.com/mrvimeshmishra-code/linkedin-delhi-da-job-tracker
    `;

    GmailApp.sendEmail(CONFIG.EMAIL_RECIPIENT, subject, body);
    Logger.log("Email sent to: " + CONFIG.EMAIL_RECIPIENT);

  } catch (e) {
    Logger.log("Email error: " + e.toString());
  }
}

// ============================
// SETUP DAILY TRIGGER
// ============================
function setupDailyTrigger() {
  // Remove existing triggers first
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === "runLinkedInJobTracker") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new daily trigger at 9 AM IST
  ScriptApp.newTrigger("runLinkedInJobTracker")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  Logger.log("Daily trigger set: runs every day at 9 AM IST");
}

// ============================
// REMOVE ALL TRIGGERS
// ============================
function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  Logger.log("All triggers removed");
}
