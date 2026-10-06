# AI Landing Page CRO Agent

Enter a product page or website URL and get a conversion-rate-optimization audit with prioritized recommendations.

## Features

- Analyze any public landing page or product page URL
- Extract page metadata, headings, CTAs, images, trust signals and page statistics
- Generate an overall CRO score
- Evaluate:
  - Headline
  - Call to Action
  - Readability
  - SEO
  - Trust
  - UX
- Show findings with severity levels
- Generate prioritized CRO recommendations
- Rule-based fallback audit when no AI API key is configured

## Project Status

- [x] Part 1: Frontend shell
- [x] Part 2: Backend + webpage analysis
- [x] Part 3: CRO report generation
- [x] Part 4: Dashboard integration

## Tech Stack

### Frontend
- React
- Vite
- CSS

### Backend
- Node.js
- Express
- Cheerio

## Project Structure

```text
cro-agent/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   └── UrlForm.jsx
│   │   │   ├── App.jsx
│   │   │   ├── main.jsx
│   │   │   └── styles.css
│   │   ├── index.html
│   │   └── vite.config.js
│
├── server/
│   ├── index.js
│   ├── analyzer.js
│   ├── report.cjs
│   ├── test-report.cjs
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md