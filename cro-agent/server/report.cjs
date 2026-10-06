// Part 3: CRO report generation.
// .cjs so it can be loaded with require() OR import, whatever style index.js uses.
// No new dependencies (uses Node 18+ built-in fetch).
//
// generateReport(analysis) -> { source, overallScore, summary, sections, recommendations }
// `analysis` is whatever analyzer.js already returns; it is passed to the model as JSON.

const AREAS = ['headline', 'cta', 'readability', 'seo', 'trust', 'ux'];

const PROMPT = `You are a senior conversion-rate-optimization (CRO) consultant.
You receive structured data extracted from a web page. Audit it and reply with ONLY valid JSON, no markdown, in this shape:
{
  "summary": "2-3 sentence overall verdict",
  "overallScore": 0-100,
  "sections": {
    "headline":    {"score": 0-100, "summary": "...", "findings": [{"issue": "...", "severity": "high|medium|low"}]},
    "cta":         {...same...},
    "readability": {...same...},
    "seo":         {...same...},
    "trust":       {...same...},
    "ux":          {...same...}
  },
  "recommendations": [
    {"priority": 1, "severity": "high|medium|low", "area": "headline|cta|readability|seo|trust|ux", "title": "short", "action": "specific, actionable fix"}
  ]
}
Rules: base every point on the data given, never invent facts about the page. If data for an area is missing, say so and score conservatively.
Give 2-4 findings per section and 5-8 recommendations ordered by priority (1 = do first, highest impact).`;

async function callAnthropic(text) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.CRO_MODEL || 'claude-sonnet-5-5',
      max_tokens: 3000,
      system: PROMPT,
      messages: [{ role: 'user', content: text }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content.map((b) => b.text || '').join('');
}

async function callOpenAI(text) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.CRO_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function parseJson(raw) {
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const SEV = ['high', 'medium', 'low'];
const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const sev = (s) => (SEV.includes(String(s).toLowerCase()) ? String(s).toLowerCase() : 'medium');

// Make sure the frontend (Part 4) can always rely on the same shape.
function normalize(r, source) {
  const sections = {};
  for (const a of AREAS) {
    const s = (r.sections && r.sections[a]) || {};
    sections[a] = {
      score: clamp(s.score),
      summary: s.summary || '',
      findings: (Array.isArray(s.findings) ? s.findings : []).map((f) => ({
        issue: typeof f === 'string' ? f : f.issue || '',
        severity: sev(f.severity),
      })),
    };
  }
  const recommendations = (Array.isArray(r.recommendations) ? r.recommendations : [])
    .map((x, i) => ({
      priority: Number(x.priority) || i + 1,
      severity: sev(x.severity),
      area: AREAS.includes(x.area) ? x.area : 'ux',
      title: x.title || '',
      action: x.action || '',
    }))
    .sort((a, b) => a.priority - b.priority);
  const overall =
    r.overallScore != null ? clamp(r.overallScore) : clamp(AREAS.reduce((t, a) => t + sections[a].score, 0) / AREAS.length);
  return { source, overallScore: overall, summary: r.summary || '', sections, recommendations };
}

// ---------- Rule-based fallback (no API key / model error) ----------
// Works with any analyzer shape by searching the object for common keys.
function deepFind(obj, re, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 5) return undefined;
  for (const [k, v] of Object.entries(obj)) {
    if (re.test(k) && v != null && v !== '') return v;
  }
  for (const v of Object.values(obj)) {
    const f = deepFind(v, re, depth + 1);
    if (f !== undefined) return f;
  }
  return undefined;
}
const asText = (v) => (Array.isArray(v) ? asText(v[0]) : v && typeof v === 'object' ? v.text || v.content || '' : v == null ? '' : String(v));
const asCount = (v) => (Array.isArray(v) ? v.length : typeof v === 'number' ? v : v ? 1 : 0);

function fallbackReport(analysis) {
  const title = asText(deepFind(analysis, /^title$/i));
  const h1 = asText(deepFind(analysis, /^(h1|headline|headings?)$/i));
  const meta = asText(deepFind(analysis, /meta.?desc/i));
  const ctas = deepFind(analysis, /cta|button/i);
  const words = Number(deepFind(analysis, /word.?count|words/i)) || 0;
  const imgNoAlt = Number(deepFind(analysis, /(missing|no).?alt/i)) || 0;
  const text = JSON.stringify(analysis).toLowerCase();
  const hasTrust = /testimonial|review|trusted by|guarantee|secure|rating|customers|partner/.test(text);
  const hasViewport = /viewport/.test(text);

  const S = (score, summary, findings) => ({ score, summary, findings });
  const sections = {
    headline: h1
      ? S(h1.length > 10 && h1.length < 90 ? 75 : 55, `Main headline found: "${h1.slice(0, 80)}".`, [
          { issue: h1.length > 90 ? 'Headline is long; aim for under ~12 words.' : 'Check the headline states a clear benefit.', severity: 'medium' },
        ])
      : S(30, 'No clear main headline detected.', [{ issue: 'Missing H1 / headline.', severity: 'high' }]),
    cta: asCount(ctas) > 0
      ? S(65, `${asCount(ctas)} call-to-action element(s) detected.`, [{ issue: 'Make the primary CTA action-oriented and visually dominant.', severity: 'medium' }])
      : S(25, 'No call-to-action detected.', [{ issue: 'No visible CTA button or link.', severity: 'high' }]),
    readability: words
      ? S(words > 1500 ? 50 : 70, `About ${words} words on the page.`, [
          { issue: words > 1500 ? 'Page is text-heavy; break up with headings and bullets.' : 'Keep paragraphs short and scannable.', severity: 'low' },
        ])
      : S(45, 'Word count unavailable.', [{ issue: 'Could not assess text length.', severity: 'low' }]),
    seo: S(
      (title ? 35 : 0) + (meta ? 35 : 0) + (h1 ? 20 : 0) + (imgNoAlt ? 0 : 10),
      `Title ${title ? 'present' : 'missing'}, meta description ${meta ? 'present' : 'missing'}.`,
      [
        ...(!title ? [{ issue: 'Missing <title> tag.', severity: 'high' }] : []),
        ...(!meta ? [{ issue: 'Missing meta description.', severity: 'high' }] : []),
        ...(imgNoAlt ? [{ issue: `${imgNoAlt} image(s) missing alt text.`, severity: 'medium' }] : []),
      ]
    ),
    trust: hasTrust
      ? S(65, 'Some trust signals detected.', [{ issue: 'Place social proof near the primary CTA.', severity: 'low' }])
      : S(30, 'No trust signals detected.', [{ issue: 'No testimonials, reviews, logos or guarantees found.', severity: 'high' }]),
    ux: S(hasViewport ? 65 : 40, hasViewport ? 'Mobile viewport tag found.' : 'No mobile viewport tag found.', [
      ...(!hasViewport ? [{ issue: 'Missing viewport meta tag; mobile layout may break.', severity: 'high' }] : []),
      { issue: 'Verify page speed and mobile tap targets manually.', severity: 'low' },
    ]),
  };

  const recommendations = [];
  for (const a of AREAS) {
    for (const f of sections[a].findings) {
      if (f.severity !== 'low' || recommendations.length < 5) {
        recommendations.push({ severity: f.severity, area: a, title: f.issue, action: f.issue });
      }
    }
  }
  recommendations.sort((x, y) => SEV.indexOf(x.severity) - SEV.indexOf(y.severity));
  recommendations.forEach((r, i) => (r.priority = i + 1));

  return normalize(
    { summary: 'Rule-based audit (no AI key configured). Set ANTHROPIC_API_KEY or OPENAI_API_KEY for a full AI report.', sections, recommendations },
    'fallback'
  );
}

// ---------- Public API ----------
async function generateReport(analysis) {
  if (!analysis || typeof analysis !== 'object') throw new Error('analysis object is required');
  const hasKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!hasKey) return fallbackReport(analysis);

  try {
    const payload = JSON.stringify(analysis).slice(0, 14000); // keep prompt size bounded
    const text = `Page analysis data:\n${payload}`;
    const raw = process.env.ANTHROPIC_API_KEY ? await callAnthropic(text) : await callOpenAI(text);
    return normalize(parseJson(raw), 'ai');
  } catch (err) {
    console.error('[report] AI call failed, using fallback:', err.message);
    const r = fallbackReport(analysis);
    r.summary = `AI generation failed (${err.message.slice(0, 80)}). Showing rule-based audit. ` + r.summary;
    return r;
  }
}

module.exports = { generateReport, fallbackReport };
