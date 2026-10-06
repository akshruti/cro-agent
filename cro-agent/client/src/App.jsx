import { useState } from "react";
import UrlForm from "./components/UrlForm.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [stage, setStage] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  async function getJson(response) {
    const text = await response.text();

    if (!text) {
      throw new Error(`Server returned an empty response (${response.status})`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Server returned invalid data (${response.status})`);
    }
  }

  async function handleAnalyze(inputUrl) {
    setUrl(inputUrl);
    setStatus("loading");
    setStage("analysis");
    setReport(null);
    setError("");

    try {
      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      const analysis = await getJson(analysisResponse);

      if (!analysisResponse.ok) {
        throw new Error(analysis.error || "Analysis failed.");
      }

      setStage("report");

      const reportResponse = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });

      const reportData = await getJson(reportResponse);

      if (!reportResponse.ok) {
        throw new Error(reportData.error || "Report generation failed.");
      }

      setReport(reportData);
      setStatus("success");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <span className="brand">CRO Agent</span>
      </header>

      <main className="container">
        <section className="intro">
          <h1>Find what's costing your product page sales</h1>
          <p>
            Paste a Shopify product page or any landing page URL. You'll get a
            conversion audit with prioritized fixes.
          </p>

          <UrlForm onAnalyze={handleAnalyze} />
        </section>

        <Dashboard
          url={url}
          status={status}
          stage={stage}
          report={report}
          error={error}
          onRetry={() => handleAnalyze(url)}
        />
      </main>
    </div>
  );
}