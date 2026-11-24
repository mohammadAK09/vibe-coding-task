# Objective Builder

A web app for trainers and instructional designers. Enter a training topic, the audience and the level, and the app returns four measurable learning objectives that climb Bloom's taxonomy, plus a three-question quiz to check understanding. Output is available in English or Arabic.

**Live app:** https://mohammadak09.github.io/vibe-coding-task/
**Repository:** https://github.com/mohammadAK09/vibe-coding-task

## How it works

```
Website (GitHub Pages)
   │  POST { topic, audience, level, language }
   ▼
n8n Webhook
   ▼
AI Content Generator (Basic LLM Chain + Google Gemini)
   ▼
Parse AI Output (Code node: cleans and validates the JSON)
   ▼
Save to Google Sheets (appends one row per request)
   ▼
Respond to Website (returns objectives + quiz + "saved" flag)
```

The n8n service does two real things that can be seen from the public link:

1. **AI generation**: the objectives and quiz shown on the page are written by the AI model inside n8n.
2. **Data logging**: every request is saved as a row in Google Sheets. The page confirms this with the message "Saved to the Google Sheets log by n8n."

## Tech used

- HTML, CSS and JavaScript (no framework), hosted on GitHub Pages
- n8n: Webhook, Basic LLM Chain, Google Gemini Chat Model, Code, Google Sheets, Respond to Webhook
- GitHub Actions CI/CD: every push to `main` checks the files and the JavaScript syntax, then deploys to GitHub Pages automatically

## Project structure

```
index.html                      Page structure
style.css                       Design (light and dark mode)
app.js                          Calls the n8n webhook and renders the results
config.js                       n8n webhook URL and repository link
n8n/objective-builder-workflow.json   Importable n8n workflow
.github/workflows/deploy.yml    CI/CD pipeline
```

## Setup

### 1. n8n
1. In n8n, choose **Import from file** and select `n8n/objective-builder-workflow.json`.
2. **Google Gemini Chat Model** node: create a credential with a free API key from Google AI Studio, then pick a current Gemini model from the dropdown.
3. Create a Google Sheet with these headers in row 1: `Timestamp | Topic | Audience | Level | Language | Title | Objectives`.
4. **Save to Google Sheets** node: connect your Google account, then choose the sheet and the tab.
5. Save the workflow and switch it to **Active**.
6. Open the **Webhook** node and copy the **Production URL**.

### 2. Website
1. Paste the Production URL into `N8N_WEBHOOK_URL` in `config.js`, and your repository link into `GITHUB_REPO_URL`.
2. Push to GitHub.
3. In the repository: **Settings → Pages → Source → GitHub Actions**.
4. Every push to `main` now deploys the site automatically.
