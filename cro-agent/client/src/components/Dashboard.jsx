// Part 4: final dashboard. Renders loading, error and report states.
const AREAS = [
  { key: "headline", label: "Headline" },
  { key: "cta", label: "Call to action" },
  { key: "readability", label: "Readability" },
  { key: "seo", label: "SEO" },
  { key: "trust", label: "Trust" },
  { key: "ux", label: "UX" },
];
const AREA_LABEL = Object.fromEntries(AREAS.map((a) => [a.key, a.label]));
const SEV_LABEL = { high: "High", medium: "Medium", low: "Low" };

function tone(score) {
  return score >= 70 ? "good" : score >= 45 ? "warn" : "bad";
}

function Severity({ level }) {
  return <span className={`sev sev-${level}`}>{SEV_LABEL[level] || "Medium"}</span>;
}

function LoadingBody() {
  return (
    <div className="dash-body" aria-hidden="true">
      <div className="score">
        <div className="score-ring pulse">
          <span>…</span>
        </div>
        <p className="score-label">Overall CRO score</p>
        <p className="score-hint">out of 100</p>
      </div>
      <ul className="areas">
        {AREAS.map((a) => (
          <li key={a.key} className="area">
            <div className="area-text">
              <h3>{a.label}</h3>
            </div>
            <div className="area-skeleton pulse">
              <span />
              <span />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Dashboard({ url, status, stage, report, error, onRetry }) {
  const loading = status === "loading";
  const failed = status === "error";

  let pill = "";
  let pillClass = "";
  if (loading) {
    pill = stage === "report" ? "Generating report…" : "Analyzing page…";
    pillClass = "status-queued";
  } else if (failed) {
    pill = "Failed";
    pillClass = "status-error";
  } else if (report) {
    pill = report.source === "ai" ? "AI report" : "Rule-based report";
  }

  return (
    <section className="dashboard" aria-live="polite" aria-busy={loading}>
      <div className="dash-head">
        <div>
          <h2>CRO audit</h2>
          <p className="dash-sub">
            <span className="dash-url">{url}</span>
          </p>
        </div>
        <span className={`status ${pillClass}`}>{pill}</span>
      </div>

      {loading && <LoadingBody />}

      {failed && (
        <div className="dash-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {!loading && !failed && report && (
        <>
          {report.summary && <p className="dash-summary">{report.summary}</p>}

          <div className="dash-body">
            <div className="score">
              <div
                className={`score-ring ${tone(report.overallScore)}`}
                role="img"
                aria-label={`Overall score ${report.overallScore} out of 100`}
              >
                <span>{report.overallScore}</span>
              </div>
              <p className="score-label">Overall CRO score</p>
              <p className="score-hint">out of 100</p>
            </div>

            <ul className="areas">
              {AREAS.map((a) => {
                const s = report.sections && report.sections[a.key];
                if (!s) return null;
                return (
                  <li key={a.key} className="area area-real">
                    <div className="area-top">
                      <h3>{a.label}</h3>
                      <span className={`score-pill ${tone(s.score)}`}>{s.score}/100</span>
                    </div>
                    <div className="meter" aria-hidden="true">
                      <span className={tone(s.score)} style={{ width: `${s.score}%` }} />
                    </div>
                    {s.summary && <p>{s.summary}</p>}
                    {(s.findings || []).length > 0 && (
                      <ul className="findings">
                        {s.findings.map((f, i) => (
                          <li key={i}>
                            <Severity level={f.severity} />
                            <span>{f.issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="recs">
            <h3>Recommendations</h3>
            <div className="rec-list">
              {(report.recommendations || []).map((r, i) => (
                <div key={i} className="rec">
                  <span className="rec-n">{r.priority}</span>
                  <div>
                    <div className="rec-meta">
                      <Severity level={r.severity} />
                      <span className="rec-area">{AREA_LABEL[r.area] || r.area}</span>
                    </div>
                    <h4>{r.title}</h4>
                    {r.action && r.action !== r.title && <p>{r.action}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
