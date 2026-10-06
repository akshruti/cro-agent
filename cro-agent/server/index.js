import express from "express";
import { analyzePage, AnalyzeError } from "./analyzer.js";
import { generateReport } from "./report.cjs";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "10kb" }));

// Allow frontend to connect to the backend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/analyze", async (req, res) => {
  try {
    const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";

    if (!url) {
      throw new AnalyzeError("Enter a page URL to analyze.");
    }

    res.json(await analyzePage(url));
  } catch (err) {
    if (err instanceof AnalyzeError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error(err);
    res.status(500).json({
      error: "Unexpected error while analyzing the page.",
    });
  }
});

app.post("/api/report", async (req, res) => {
  try {
    if (!req.body?.analysis) {
      return res.status(400).json({
        error: "Analysis data is required.",
      });
    }

    res.json(await generateReport(req.body.analysis));
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`CRO Agent server running on http://localhost:${PORT}`);
});