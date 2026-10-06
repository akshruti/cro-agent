 CRO Agent

A lightweight AI-assisted Conversion Rate Optimization (CRO) Agent that analyzes a webpage and generates a prioritized CRO audit.

🚀 Features

* Enter any webpage or landing-page URL
* Analyze webpage content and structure
* Extract headings, CTAs, images, metadata, trust signals and social proof
* Generate an overall CRO score out of 100
* Evaluate:

  * Headline
  * Call to Action
  * Readability
  * SEO
  * Trust
  * UX
* Identify issues with High, Medium and Low severity
* Generate prioritized recommendations
* Rule-based fallback report when an AI API key is not configured

🛠️ Tech Stack

Frontend

* React
* Vite
* CSS

 Backend

* Node.js
* Express.js
* Cheerio

AI / Reporting

* AI-assisted CRO report generation
* Rule-based fallback analysis when no AI API key is available

🏗️ Architecture

text
User
  ↓
React Frontend
  ↓
POST /api/analyze
  ↓
Webpage Analyzer
  ↓
Extract webpage signals
  ↓
POST /api/report
  ↓
CRO Report Generator
  ↓
Dashboard
  ├── Overall Score
  ├── CRO Areas
  ├── Findings
  └── Prioritized Recommendations


📁 Project Structure

text
cro-agent/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   └── UrlForm.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── vite.config.js
│
├── server/
│   ├── index.js
│   ├── analyzer.js
│   ├── report.cjs
│   ├── test-report.cjs
│   ├── package.json
│   └── package-lock.json
│
├── LLM_CONVERSATIONS.md
├── README.md
└── .gitignore


⚙️ Setup

1. Clone the repository

bash
git clone https://github.com/akshruti/cro-agent.git
cd cro-agent


### 2. Install backend dependencies

bash
cd server
npm install


3. Start the backend

bash
node index.js


Backend runs on:

text
http://localhost:3001


4. Start the frontend

Open another terminal:

bash
cd client
npm install
npm run dev


Open the URL shown by Vite, for example:

text
http://localhost:5174/


🔄 How It Works

1. User enters a webpage URL.
2. The frontend sends the URL to the backend.
3. The analyzer fetches and extracts useful webpage signals.
4. The report generator evaluates the extracted data.
5. The application calculates a CRO score.
6. The dashboard displays findings and prioritized recommendations.

📊 CRO Report

The dashboard provides:

* Overall CRO score
* Individual area scores
* Progress indicators
* Detailed findings
* Severity levels
* Prioritized recommendations

Example:

text
Overall CRO Score: 55/100

Headline
CTA
Readability
SEO
Trust
UX

Recommendations
1. High   Missing H1 / headline
2. High   Missing meta description
3. Medium Improve primary CTA


🤖 LLM Usage

LLMs were used during development for:

* Planning the project architecture
* Breaking the assignment into implementation steps
* Debugging and improving code
* Designing the CRO report structure
* Reviewing UI and user flow
* Generating and refining implementation prompts

The important LLM conversations and prompts used during development are documented in:

LLM_CONVERSATIONS.md

🎥 Demo

The recorded demo demonstrates the complete flow:

text
URL Input
   ↓
Page Analysis
   ↓
CRO Score
   ↓
Detailed Findings
   ↓
Prioritized Recommendations


📌 Current Status

**Completed**

* End-to-end URL analysis
* Webpage signal extraction
* CRO scoring
* CRO report generation
* Dashboard UI
* Severity-based recommendations
* Error handling
* README documentation
* LLM conversation documentation
* Demo video

