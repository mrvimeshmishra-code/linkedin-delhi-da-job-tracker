# 🔍 LinkedIn Delhi Data Analyst Job Tracker

> **Automatically scrapes LinkedIn job posts for Data Analyst roles in Delhi/NCR and appends job details to Google Sheets using Google Apps Script — no manual search needed!**

[![Made with Google Apps Script](https://img.shields.io/badge/Made%20with-Google%20Apps%20Script-blue?logo=google&logoColor=white)](https://script.google.com)
[![Job Role](https://img.shields.io/badge/Job%20Role-Data%20Analyst-green)](https://www.linkedin.com/jobs/)
[![Location](https://img.shields.io/badge/Location-Delhi%2FNCR-orange)](https://www.linkedin.com/jobs/)
[![Auto Tracker](https://img.shields.io/badge/Auto-Tracker-brightgreen)](https://github.com/mrvimeshmishra-code/linkedin-delhi-da-job-tracker)

---

## 📌 What This Project Does

This project uses **Google Apps Script** to:

1. 🔎 **Search LinkedIn jobs** for "Data Analyst" in Delhi/NCR region
2. 📋 **Extract job details** — Title, Company, Location, Date Posted, Job URL, Experience Required, Skills
3. 📊 **Auto-append to Google Sheet** — Every run adds new unique jobs only (no duplicates)
4. ⏰ **Scheduled via Time Trigger** — Runs automatically every day or every few hours
5. 📧 **Email Alert** — Sends a summary email after each run with count of new jobs found

---

## 🗂️ Project Structure

```
linkedin-delhi-da-job-tracker/
│
├── scripts/
│   ├── linkedin_job_scraper.gs      # Main script — fetches LinkedIn job posts
│   ├── sheet_manager.gs             # Handles Google Sheet read/write/dedup
│   ├── email_notifier.gs            # Sends email summary after each run
│   └── trigger_setup.gs             # Sets up daily time-based trigger
│
├── sample_data/
│   └── sample_jobs_output.csv       # Sample output with 20 job entries
│
├── docs/
│   └── setup_guide.md               # Step-by-step setup instructions
│
└── README.md
```

---

## 📊 Google Sheet Output Format

| Column | Field | Example |
|--------|-------|---------|
| A | Job Title | Data Analyst |
| B | Company Name | Accenture India |
| C | Location | Delhi, India |
| D | Date Posted | 2 days ago |
| E | Job URL | https://linkedin.com/jobs/view/... |
| F | Experience Required | 2-4 years |
| G | Key Skills | SQL, Power BI, Excel |
| H | Date Scraped | 02-Jul-2026 |

---

## ⚙️ How It Works

```
LinkedIn Jobs Search API (via URL)
        ↓
Google Apps Script fetches job listings
        ↓
Parses: Title, Company, Location, Date, URL
        ↓
Checks Google Sheet for duplicates (by URL)
        ↓
Appends only NEW jobs to Google Sheet
        ↓
Sends Email Summary: "X new Data Analyst jobs found today!"
```

---

## 🚀 Setup Instructions

### Step 1: Copy the Google Sheet Template
- Create a new Google Sheet
- Name it: **LinkedIn DA Jobs - Delhi Tracker**
- Note the **Sheet ID** from the URL

### Step 2: Open Apps Script
- In Google Sheet → **Extensions → Apps Script**
- Paste the code from `scripts/linkedin_job_scraper.gs`

### Step 3: Configure Settings
```javascript
// In linkedin_job_scraper.gs — update these constants:
const SHEET_ID = "your-google-sheet-id-here";
const EMAIL_RECIPIENT = "mr.vimeshmishra@gmail.com";
const SEARCH_KEYWORDS = "Data Analyst";
const SEARCH_LOCATION = "Delhi, India";
const MAX_JOBS_PER_RUN = 25;
```

### Step 4: Run the Trigger Setup
- Run `setupDailyTrigger()` once to schedule automatic daily runs

### Step 5: Authorize & Run
- Click **Run → linkedin_job_scraper** → Grant permissions
- Check your Google Sheet for fresh job listings!

---

## 📋 Sample Output (Preview)

| Job Title | Company | Location | Date | Experience |
|-----------|---------|----------|------|------------|
| Data Analyst | Accenture | Delhi | 1 day ago | 2-4 yrs |
| MIS Analyst | Genpact | Gurugram | 2 days ago | 1-3 yrs |
| Business Analyst | Wipro | Noida | 3 days ago | 3-5 yrs |
| Data Analyst - BI | HCL Tech | Delhi | Today | 2-5 yrs |
| Junior Data Analyst | Paytm | Delhi | 1 day ago | 0-2 yrs |

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| **Google Apps Script** | Core automation engine |
| **Google Sheets API** | Store & manage job data |
| **UrlFetchApp** | Fetch LinkedIn job listings |
| **Gmail API** | Send email notifications |
| **Time-based Trigger** | Schedule automatic runs |
| **RegEx + JSON Parsing** | Extract structured job data |

---

## 📈 Business Value

- ⏱️ **Saves 2-3 hours/week** of manual LinkedIn job searching
- 🔔 **Never miss a job post** — runs automatically every day
- 📊 **Organized tracking** — all jobs in one Google Sheet with filters
- 🚫 **No duplicates** — smart URL-based deduplication
- 📧 **Daily summary** in your inbox

---

## 👤 Author

**Vimesh Kumar Mishra**
📧 mr.vimeshmishra@gmail.com | 📱 +91 6306145502
🔗 [LinkedIn](https://www.linkedin.com/in/vimesh-kumar-mishra/) | 🐙 [GitHub](https://github.com/mrvimeshmishra-code)

> *"Automating repetitive tasks is the first step towards smarter work."*

---

## ⭐ If this project helped you, give it a star!
