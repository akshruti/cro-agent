import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";

export class AnalyzeError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const CTA_WORDS =
  /\b(add to (cart|bag)|buy( it)? now|buy|shop now|order now|checkout|get started|subscribe|sign up|start free)\b/i;

const TRUST_SIGNALS = [
  ["Free shipping", /free (shipping|delivery)/i],
  ["Returns or refunds", /\b(returns?|refunds?)\b/i],
  ["Guarantee", /guarantee/i],
  ["Secure checkout", /secure (checkout|payment)|encrypted/i],
  ["Warranty", /warranty/i],
  ["Customer support", /(customer|24\/7) (support|service)|contact us/i],
];

// --- URL safety: block localhost/private networks unless explicitly allowed (for local testing) ---
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:");
}

async function validateUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new AnalyzeError("Enter a valid URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AnalyzeError("Only http and https URLs are supported.");
  }
  if (process.env.ALLOW_PRIVATE_HOSTS !== "true") {
    let addrs;
    try {
      addrs = await dns.lookup(url.hostname, { all: true });
    } catch {
      throw new AnalyzeError("Couldn't find that website. Check the address and try again.", 422);
    }
    if (addrs.some((a) => isPrivateIp(a.address))) {
      throw new AnalyzeError("Local and private addresses can't be analyzed.");
    }
  }
  return url;
}

async function fetchHtml(url) {
  let res;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CROAgent/0.2)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    if (err.name === "TimeoutError") throw new AnalyzeError("The page took too long to respond (12s limit).", 504);
    throw new AnalyzeError("Couldn't reach that page. Check the URL and try again.", 502);
  }
  if (!res.ok) throw new AnalyzeError(`The site responded with HTTP ${res.status}. It may block automated requests.`, 422);
  if (!(res.headers.get("content-type") || "").includes("html")) {
    throw new AnalyzeError("That URL doesn't return a web page.", 422);
  }
  return { html: (await res.text()).slice(0, 2_000_000), finalUrl: res.url };
}

// --- Structured data (JSON-LD) ---
function readJsonLd($) {
  const nodes = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).contents().text());
      nodes.push(...(Array.isArray(data) ? data : data["@graph"] || [data]));
    } catch {
      /* ignore malformed JSON-LD */
    }
  });
  return nodes;
}

export async function analyzePage(input) {
  const url = await validateUrl(input);
  const { html, finalUrl } = await fetchHtml(url);
  const $ = cheerio.load(html);

  const isShopify = /cdn\.shopify\.com|myshopify\.com|Shopify\.theme/i.test(html);
  const ld = readJsonLd($).find((n) => [].concat(n["@type"] || []).includes("Product"));
  const offer = [].concat(ld?.offers || [])[0] || {};
  const rating = ld?.aggregateRating;

  $("script, style, noscript, svg").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const metaName = (n) => $(`meta[name="${n}"]`).attr("content")?.trim() || "";

  const headings = (tag, limit) =>
    $(tag).map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get().filter(Boolean).slice(0, limit);

  const seen = new Set();
  const ctas = [];
  $("button, a, input[type=submit], input[type=button]").each((_, el) => {
    const raw = $(el).is("input") ? $(el).attr("value") : $(el).text();
    const label = raw?.replace(/\s+/g, " ").trim();
    if (!label || label.length > 40 || !CTA_WORDS.test(label)) return;
    if (seen.has(label.toLowerCase())) return;
    seen.add(label.toLowerCase());
    ctas.push(label);
  });

  const images = $("img").get();

  return {
    url: input,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    isShopify,
    meta: {
      title: $("title").first().text().trim(),
      description: metaName("description"),
      hasViewport: Boolean(metaName("viewport")),
    },
    headings: { h1: headings("h1", 5), h2: headings("h2", 8) },
    product: ld ? { name: ld.name || "", price: offer.price ?? offer.lowPrice ?? null, currency: offer.priceCurrency || "" } : null,
    ctas: ctas.slice(0, 10),
    images: {
      total: images.length,
      missingAlt: images.filter((el) => !$(el).attr("alt")?.trim()).length,
    },
    trustSignals: TRUST_SIGNALS.map(([label, re]) => ({ label, found: re.test(text) })),
    socialProof: {
      mentionsReviews: /\b(reviews?|ratings?|testimonials?)\b/i.test(text),
      ratingValue: rating?.ratingValue ?? null,
      reviewCount: rating?.reviewCount ?? rating?.ratingCount ?? null,
    },
    stats: { wordCount: text ? text.split(" ").length : 0, links: $("a").length, forms: $("form").length },
  };
}
