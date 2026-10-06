import { useRef, useState } from "react";
import UrlForm from "./components/UrlForm.jsx";
import DashboardPlaceholder from "./components/DashboardPlaceholder.jsx";
import Dashboard from "./components/Dashboard.jsx";

// Backend base URL. Override with VITE_API_URL in client/.env if needed.
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function postJson(path, body) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Could not reach the server at ${API}. Is it running?`);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

export default function App() {
  // idle | loading | error | done
  const [job, setJob] = useState({ url: null, status: "idle" });
  const latest = useRef(0); // ignore results from superseded requests

  async function handleAnalyze(url) {
    const id = ++latest.current;
    setJob({ url, status: "loading", stage: "analyze" });
    try {
      const analyzed = await postJson("/api/analyze", { url });
      if (id !== latest.current) return;
      setJob({ url, status: "loading", stage: "report" });
      const report = await postJson("/api/report", { analysis: analyzed.analysis ?? analyzed });
      if (id !== latest.current) return;
      setJob({ url, status: "done", report });
    } catch (err) {
      if (id !== latest.current) return;
      setJob({ url, status: "error", error: err.message || "Something went wrong." });
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

        {job.status === "idle" ? (
          <DashboardPlaceholder url={null} />
        ) : (
          <Dashboard {...job} onRetry={() => handleAnalyze(job.url)} />
        )}
      </main>
    </div>
  );
}
