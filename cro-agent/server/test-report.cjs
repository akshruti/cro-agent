// Standalone test for Part 3. Run from server/:  node test-report.cjs
// Optional: pass a URL to analyze it with your real analyzer first (see bottom).
const { generateReport } = require('./report.cjs');

const sample = {
  url: 'https://example.com',
  title: 'Acme - Project software',
  metaDescription: '',
  h1: 'Welcome to Acme',
  headings: ['Welcome to Acme', 'Features', 'Pricing'],
  ctas: [{ text: 'Learn more' }],
  wordCount: 820,
  images: { total: 6, missingAlt: 4 },
  viewport: true,
};

generateReport(sample)
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    console.log(`\nsource: ${r.source} | overall: ${r.overallScore}/100 | recs: ${r.recommendations.length}`);
  })
  .catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
  });
