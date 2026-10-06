// Audit areas the real report will cover. Content is placeholder only.
const AREAS = [
  { name: "Value proposition", note: "Is the offer clear in the first few seconds?" },
  { name: "Calls to action", note: "Is the buy button visible, specific and compelling?" },
  { name: "Trust signals", note: "Reviews, guarantees, return policy, secure checkout." },
  { name: "Product content", note: "Images, description quality and key details." },
  { name: "Page experience", note: "Mobile layout, load speed and friction points." },
];

export default function DashboardPlaceholder({ url }) {
  const hasUrl = Boolean(url);

  return (
    <section className="dashboard" aria-live="polite">
      <div className="dash-head">
        <div>
          <h2>CRO audit</h2>
          <p className="dash-sub">
            {hasUrl ? (
              <>
                Queued for analysis: <span className="dash-url">{url}</span>
              </>
            ) : (
              "Your report will appear here after you analyze a page."
            )}
          </p>
        </div>
        <span className={`status ${hasUrl ? "status-queued" : ""}`}>
          {hasUrl ? "Analysis not connected yet" : "Waiting for a URL"}
        </span>
      </div>

      <div className="dash-body">
        <div className="score">
          <div className="score-ring" aria-label="Overall score not available">
            <span>–</span>
          </div>
          <p className="score-label">Overall CRO score</p>
          <p className="score-hint">out of 100</p>
        </div>

        <ul className="areas">
          {AREAS.map((area) => (
            <li key={area.name} className="area">
              <div className="area-text">
                <h3>{area.name}</h3>
                <p>{area.note}</p>
              </div>
              <div className="area-skeleton" aria-hidden="true">
                <span />
                <span />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
