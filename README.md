#  QA Error Inspector – Chrome DevTools Extension

##  Overview

QA Error Inspector is a Chrome DevTools extension built for Quality Analysts and Testers to automatically detect and display:

-  Failed REST APIs (4xx / 5xx)
-  GraphQL errors (errors[])
-  Asset failures (SVG, JS, images)
-  Request payloads
-  Error responses

This eliminates the need to manually inspect Network  Preview  Response during testing.

##  Problem It Solves

During QA testing, identifying why a feature fails often requires:

- Opening DevTools
- Navigating to Network tab
- Searching failed requests
- Checking payloads and responses manually

This process is slow and repetitive.

 **QA Error Inspector automates this entire flow.**

##  Key Features

-  Listens to all network requests in real time
-  Detects HTTP errors (400, 401, 403, 404, 500)
-  Detects GraphQL errors[]
-  Shows:
  - API URL
  - HTTP method
  - Status code
  - Request payload
  - Error response
-  Designed specifically for QA workflows
-  Runs inside Chrome DevTools

##  Tech Stack

- JavaScript
- Chrome Extension (Manifest v3)
- Chrome DevTools API

##  Project Structure

```
qa-error-inspector/

 manifest.json
 devtools.html
 devtools.js
 panel.html
 panel.js
 README.md
```

##  How to Install (Local / Internal Use)

**No Chrome Web Store required**

1. Clone the repository:

```bash
git clone https://github.com/kuro-shiv/qa-error-inspector
```

2. Open Chrome and navigate to:

```
chrome://extensions
```

3. Enable **Developer Mode** (top-right toggle)

4. Click **Load unpacked**

5. Select the `qa-error-inspector` folder

 **Extension is now installed.**

##  How to Use

1. Open any website
2. Press `Ctrl + Shift + I` to open DevTools
3. Navigate to the **QA Errors** tab
4. Perform test actions
5. Failed APIs & GraphQL errors appear automatically

##  Ideal For

- Manual QA Engineers
- Automation QA
- Frontend Testers
- GraphQL-based applications
- Startup product testing

##  Future Enhancements (Planned)

- API filtering & search
- Copy error as JIRA ticket
- Export logs (JSON)
- Performance monitoring
- Ignore known APIs
