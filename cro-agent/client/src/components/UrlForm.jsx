import { useState } from "react";

// Adds https:// if missing and checks the result looks like a real web address.
function normalizeUrl(raw) {
  const value = raw.trim();
  if (!value) return { error: "Enter a page URL to analyze." };

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) throw new Error("bad host");
    return { url: url.href };
  } catch {
    return { error: "That doesn't look like a valid URL. Try https://yourstore.com/products/example" };
  }
}

export default function UrlForm({ onAnalyze }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const result = normalizeUrl(value);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    onAnalyze(result.url);
  }

  return (
    <form className="url-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="page-url" className="sr-only">Page URL</label>
      <div className="url-row">
        <input
          id="page-url"
          type="text"
          inputMode="url"
          placeholder="https://yourstore.com/products/example"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "url-error" : undefined}
          autoComplete="off"
        />
        <button type="submit">Analyze page</button>
      </div>
      {error && (
        <p id="url-error" className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
