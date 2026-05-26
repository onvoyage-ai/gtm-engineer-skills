#!/usr/bin/env node

/**
 * AEO Audit — zero-dependency website AI-discoverability auditor.
 *
 * Crawls a site the way an AI agent would (sitemap + robots.txt + internal
 * links), runs 16 deterministic checks per page, and produces a foundational
 * AEO score plus a heuristic intelligence prior. The agent layer (SKILL.md)
 * then reads `pagesForReview` and scores the 6 LLM dimensions itself.
 *
 * Requires Node 18+ (global fetch). No npm install needed.
 *
 * Usage:
 *   node aeo-audit.mjs <url> [--max-pages=10] [--out=aeo-audit-report.json] [--json]
 *
 *   node aeo-audit.mjs https://example.com
 *   node aeo-audit.mjs example.com --max-pages=20 --out=workspace/acme/aeo-audit.json
 *   node aeo-audit.mjs https://example.com --json        # print JSON to stdout
 *
 * Output:
 *   - Human-readable summary printed to stdout
 *   - Full JSON report written to --out (default ./aeo-audit-report.json)
 *
 * Notes on fidelity: HTML is parsed with regex/string ops (no cheerio), so
 * parsing is slightly less robust than a full DOM. Checks are designed to
 * tolerate this — they measure presence/structure, not exact rendering.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ─── Config ──────────────────────────────────────────────────────────────────

const AI_BOT_AGENTS = [
  "gptbot", "claudebot", "perplexitybot", "google-extended",
  "oai-searchbot", "anthropic-ai", "chatgpt-user", "bytespider", "ccbot",
];
const RECOGNIZED_SCHEMA_TYPES = [
  "Organization", "WebSite", "WebPage", "Article", "Product", "FAQPage",
  "BreadcrumbList", "LocalBusiness", "Person", "Event", "HowTo", "Recipe",
  "VideoObject", "SoftwareApplication",
];
const MAX_CRAWL_LIMIT = 30;
const MAX_HTML_BYTES = 512_000;
const FETCH_TIMEOUT_MS = 12_000;
const CRAWL_CONCURRENCY = 5;
const UA = "Mozilla/5.0 (compatible; AEOAuditBot/1.0; +https://github.com/onvoyage-ai/gtm-engineer-skills)";

// ─── Small utilities ─────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const collapse = (s) => (s || "").replace(/\s+/g, " ").trim();
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const scoreToInt = (v) => Math.round(Math.min(100, Math.max(0, v)));
const average = (vals) => (vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length);

function decodeEntities(s) {
  if (!s) return s;
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X"
        ? parseInt(e.slice(2), 16)
        : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? safeCodePoint(code, m) : m;
    }
    const named = {
      amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
      mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘",
      ldquo: "“", rdquo: "”", copy: "©", reg: "®", trade: "™",
    };
    return named[e] !== undefined ? named[e] : m;
  });
}
function safeCodePoint(code, fallback) {
  try { return String.fromCodePoint(code); } catch { return fallback; }
}

function parseArgs(argv) {
  const args = { url: "", maxPages: 10, out: "aeo-audit-report.json", json: false };
  for (const a of argv) {
    if (a.startsWith("--max-pages=")) args.maxPages = parseInt(a.split("=")[1], 10) || 10;
    else if (a.startsWith("--out=")) args.out = a.split("=")[1];
    else if (a === "--json") args.json = true;
    else if (a === "--no-out") args.out = "";
    else if (a === "-h" || a === "--help") args.help = true;
    else if (!a.startsWith("--")) args.url = a;
  }
  return args;
}

// ─── HTML parsing helpers (regex-based, no DOM) ──────────────────────────────

/** Parse the attribute string inside a tag into a lowercase-keyed map. */
function parseAttrs(tagInner) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let m;
  while ((m = re.exec(tagInner))) {
    const name = m[1].toLowerCase();
    let val = m[2] ?? "";
    if (val && (val[0] === '"' || val[0] === "'")) val = val.slice(1, -1);
    attrs[name] = decodeEntities(val);
  }
  return attrs;
}

/** All occurrences of a void/open tag, returning attribute maps. */
function findOpenTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(parseAttrs(m[1]));
  return out;
}

/** Inner HTML of the first matching element. */
function firstInner(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = html.match(re);
  return m ? m[1] : "";
}

/** Inner HTML/text of every matching element. */
function allInner(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

const stripTags = (s) => (s || "").replace(/<[^>]+>/g, " ");

/** Plain visible text from an HTML fragment (drops script/style/noscript). */
function visibleText(html) {
  let s = (html || "").replace(/<!--[\s\S]*?-->/g, " ");
  for (const tag of ["script", "style", "noscript"]) {
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }
  return collapse(decodeEntities(stripTags(s)));
}

/** Cleaned main-content excerpt: drops boilerplate, prefers <main>/<article>. */
function contentExcerpt(bodyInner) {
  let s = (bodyInner || "").replace(/<!--[\s\S]*?-->/g, " ");
  for (const tag of ["script", "style", "noscript", "nav", "header", "footer", "iframe", "svg", "form"]) {
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }
  const main = firstInner(s, "main") || firstInner(s, "article");
  return collapse(decodeEntities(stripTags(main || s))).slice(0, 2000);
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

function normalizeUrl(raw) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const u = new URL(withProtocol);
  u.hash = "";
  u.search = "";
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
}

function shouldSkipPath(pathname) {
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg|ico|zip|rar|7z|mp4|mp3|mov|avi|woff2?|ttf|eot|css|js)$/i.test(pathname);
}

function escapeRegex(input) {
  return input.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function ruleMatches(pathname, rule) {
  const trimmed = (rule || "").trim();
  if (!trimmed) return false;
  const pattern = escapeRegex(trimmed).replace(/\\\*/g, ".*");
  return new RegExp(`^${pattern}`).test(pathname);
}

function isPathAllowed(pathname, policy) {
  let bestAllow = -1;
  let bestDisallow = -1;
  for (const rule of policy.allow) {
    if (ruleMatches(pathname, rule)) bestAllow = Math.max(bestAllow, rule.length);
  }
  for (const rule of policy.disallow) {
    if (ruleMatches(pathname, rule)) bestDisallow = Math.max(bestDisallow, rule.length);
  }
  if (bestAllow === -1 && bestDisallow === -1) return true;
  return bestAllow >= bestDisallow;
}

// ─── Network ─────────────────────────────────────────────────────────────────

async function fetchText(url, attempts = 2) {
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return text.length > MAX_HTML_BYTES ? text.slice(0, MAX_HTML_BYTES) : text;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error("request failed");
      if (i < attempts - 1) await sleep(350 * (i + 1));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastErr ?? new Error("request failed");
}

async function fetchRobotsPolicy(startUrl) {
  const robotsUrl = `${startUrl.protocol}//${startUrl.host}/robots.txt`;
  const fallback = { allow: [], disallow: [], sitemapUrls: [], found: false, aiBotBlocked: [] };
  try {
    const txt = await fetchText(robotsUrl);
    const lines = txt.split(/\r?\n/).map((l) => l.trim());
    const sitemaps = new Set();
    const starAllow = [];
    const starDisallow = [];
    const agentRules = new Map();
    let currentAgent = "";

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s*#.*$/, "").trim();
      if (!line || !line.includes(":")) continue;
      const idx = line.indexOf(":");
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();

      if (key === "user-agent") {
        currentAgent = value.toLowerCase();
        if (AI_BOT_AGENTS.includes(currentAgent) && !agentRules.has(currentAgent)) {
          agentRules.set(currentAgent, { allow: [], disallow: [] });
        }
        continue;
      }
      if (key === "sitemap" && value) {
        try {
          const sm = new URL(value, robotsUrl);
          if (sm.host === startUrl.host) sitemaps.add(sm.toString());
        } catch { /* ignore malformed */ }
        continue;
      }
      if (AI_BOT_AGENTS.includes(currentAgent)) {
        const rules = agentRules.get(currentAgent);
        if (rules) {
          if (key === "allow" && value) rules.allow.push(value);
          if (key === "disallow" && value) rules.disallow.push(value);
        }
      }
      if (currentAgent !== "*") continue;
      if (key === "allow") starAllow.push(value);
      if (key === "disallow") starDisallow.push(value);
    }

    const aiBotBlocked = [];
    for (const [agent, rules] of agentRules) {
      const blocksAll = rules.disallow.some((r) => r.trim() === "/");
      const allowsAll = rules.allow.some((r) => r.trim() === "/");
      if (blocksAll && !allowsAll) aiBotBlocked.push(agent);
    }

    return {
      allow: starAllow.filter(Boolean),
      disallow: starDisallow.filter(Boolean),
      sitemapUrls: [...sitemaps],
      found: true,
      aiBotBlocked,
    };
  } catch {
    return fallback;
  }
}

function extractSitemapLocs(xml) {
  const locs = [];
  for (const m of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)) {
    const v = m[1]?.trim();
    if (v) locs.push(v);
  }
  return locs;
}

async function fetchSitemapUrls(startUrl, policy, limit) {
  const queue = [...policy.sitemapUrls];
  if (queue.length === 0) {
    queue.push(`${startUrl.protocol}//${startUrl.host}/sitemap.xml`);
    queue.push(`${startUrl.protocol}//${startUrl.host}/sitemap_index.xml`);
  }
  const seen = new Set();
  const out = new Set();

  while (queue.length > 0 && out.size < limit) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || seen.has(sitemapUrl)) continue;
    seen.add(sitemapUrl);
    try {
      const xml = await fetchText(sitemapUrl);
      const isIndex = /<sitemapindex[\s>]/i.test(xml);
      for (const loc of extractSitemapLocs(xml)) {
        try {
          const u = new URL(loc, sitemapUrl);
          if (u.host !== startUrl.host) continue;
          u.hash = "";
          u.search = "";
          if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
          if (shouldSkipPath(u.pathname)) continue;
          if (!isPathAllowed(u.pathname || "/", policy)) continue;
          if (isIndex) queue.push(u.toString());
          else out.add(u.toString());
          if (out.size >= limit) break;
        } catch { /* ignore malformed */ }
      }
    } catch { /* ignore inaccessible sitemap */ }
  }
  return [...out];
}

async function detectRssFeed(startPageHtml, startUrl) {
  for (const link of findOpenTags(startPageHtml, "link")) {
    const rel = (link.rel || "").toLowerCase();
    const type = (link.type || "").toLowerCase();
    if (rel.includes("alternate") && /(rss|atom)\+xml/.test(type)) return true;
  }
  const base = `${startUrl.protocol}//${startUrl.host}`;
  for (const path of ["/feed", "/rss.xml", "/atom.xml", "/feed.xml"]) {
    try {
      const content = await fetchText(`${base}${path}`, 1);
      if (/<rss[\s>]|<feed[\s>]|<channel[\s>]/i.test(content)) return true;
    } catch { /* try next */ }
  }
  return false;
}

async function validateLlmsTxt(startUrl) {
  const base = `${startUrl.protocol}//${startUrl.host}`;
  const result = { found: false, hasH1: false, hasLink: false, contentLength: 0, fullTxtFound: false };
  try {
    const content = await fetchText(`${base}/llms.txt`, 1);
    result.found = true;
    result.contentLength = content.trim().length;
    result.hasH1 = /^#\s+.+/m.test(content);
    result.hasLink = /\[.+?\]\(.+?\)/.test(content);
  } catch {
    return result;
  }
  try {
    await fetchText(`${base}/llms-full.txt`, 1);
    result.fullTxtFound = true;
  } catch { /* optional file */ }
  return result;
}

export const isLlmsTxtValid = (r) => r.found && r.hasH1 && r.hasLink && r.contentLength > 100;

// ─── Page extraction ─────────────────────────────────────────────────────────

function extractInternalLinks(html, pageUrl, startHost, policy) {
  const out = new Set();
  for (const a of findOpenTags(html, "a")) {
    const href = a.href || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const u = new URL(href, pageUrl);
      if (!["http:", "https:"].includes(u.protocol)) continue;
      if (u.host !== startHost) continue;
      u.hash = "";
      u.search = "";
      if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
      if (shouldSkipPath(u.pathname)) continue;
      if (!isPathAllowed(u.pathname || "/", policy)) continue;
      out.add(u.toString());
    } catch { /* ignore malformed */ }
  }
  return [...out].slice(0, 40);
}

export function extractAiView(html, pageUrl) {
  const title = collapse(stripTags(firstInner(html, "title")));

  const metaTags = findOpenTags(html, "meta");
  const metaByName = {};
  const metaByProp = {};
  for (const m of metaTags) {
    if (m.name) metaByName[m.name.toLowerCase()] = m.content || "";
    if (m.property) metaByProp[m.property.toLowerCase()] = m.content || "";
  }
  const metaDescription = (metaByName.description || "").trim();

  const h1 = allInner(html, "h1").map((t) => collapse(stripTags(t))).filter(Boolean).slice(0, 8);
  const h1Count = (html.match(/<h1\b[^>]*>/gi) || []).length;

  const headings = [];
  for (const m of html.matchAll(/<(h[23])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = collapse(stripTags(m[2]));
    if (t) headings.push(t);
  }

  // JSON-LD
  const jsonLdBlocks = [];
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    jsonLdBlocks.push(m[1]);
  }
  const schemaTypes = [];
  const jsonLdParts = [];
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block.trim());
      const items = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
      for (const item of items) {
        if (!item || !item["@type"]) continue;
        const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        schemaTypes.push(...types);
        const fields = [`@type=${types.join(",")}`];
        if (item.name) fields.push(`name=${String(item.name).slice(0, 80)}`);
        if (item.author) {
          const an = typeof item.author === "string" ? item.author : item.author?.name;
          if (an) fields.push(`author=${String(an).slice(0, 60)}`);
        }
        if (item.datePublished) fields.push(`datePublished=${String(item.datePublished).slice(0, 20)}`);
        if (item.dateModified) fields.push(`dateModified=${String(item.dateModified).slice(0, 20)}`);
        if (item.publisher?.name) fields.push(`publisher=${String(item.publisher.name).slice(0, 60)}`);
        if (item.description) fields.push(`description=${String(item.description).slice(0, 100)}`);
        jsonLdParts.push(fields.join(" | "));
      }
    } catch { /* ignore malformed JSON-LD */ }
  }

  // Internal link count
  let internalLinkCount = 0;
  for (const a of findOpenTags(html, "a")) {
    const href = a.href || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      if (new URL(href, pageUrl).host === pageUrl.host) internalLinkCount += 1;
    } catch { /* ignore */ }
  }

  // Body text
  const bodyInner = firstInner(html, "body") || html;
  const bodyWordCount = visibleText(bodyInner).split(/\s+/).filter(Boolean).length;
  const textExcerpt = contentExcerpt(bodyInner);

  // Date / author signals
  const timeMatch = html.match(/<time\b[^>]*\bdatetime\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
  const timeDatetime = timeMatch ? timeMatch[1].replace(/^["']|["']$/g, "") : "";
  const publishedDate =
    metaByProp["article:published_time"] || metaByName.date ||
    metaByName["dc.date"] || timeDatetime || "";
  const modifiedDate =
    metaByProp["article:modified_time"] || metaByName["last-modified"] || "";
  const author = metaByName.author || metaByProp["article:author"] || "";

  // Restrictive AI meta tags
  const aiMetaTags = new Set();
  for (const m of metaTags) {
    const name = (m.name || "").toLowerCase();
    if (name !== "robots" && name !== "googlebot") continue;
    const content = (m.content || "").toLowerCase();
    if (content.includes("nosnippet")) aiMetaTags.add("nosnippet");
    if (content.includes("noai")) aiMetaTags.add("noai");
    if (content.includes("noimageai")) aiMetaTags.add("noimageai");
  }

  // noindex
  const hasNoindex = metaTags.some(
    (m) => (m.name || "").toLowerCase() === "robots" &&
      (m.content || "").toLowerCase().includes("noindex")
  );

  // canonical
  let canonical = "";
  for (const link of findOpenTags(html, "link")) {
    if ((link.rel || "").toLowerCase() === "canonical" && link.href) {
      canonical = link.href.trim();
      break;
    }
  }

  // Open Graph
  const hasOg = !!metaByProp["og:title"] && !!metaByProp["og:description"];

  // Images
  const imgs = findOpenTags(html, "img");
  const imgsWithAlt = imgs.filter((i) => (i.alt || "").trim().length > 0).length;

  // Heading hierarchy
  const headingLevels = [];
  for (const m of html.matchAll(/<(h[1-6])\b[^>]*>/gi)) {
    headingLevels.push(parseInt(m[1].slice(1), 10));
  }

  return {
    title, metaDescription, h1, h1Count, headings: headings.slice(0, 16),
    jsonLdCount: jsonLdBlocks.length,
    schemaTypes: [...new Set(schemaTypes)],
    jsonLdSummary: jsonLdParts.slice(0, 5).join("\n"),
    internalLinkCount, textExcerpt, bodyWordCount,
    publishedDate, modifiedDate, author,
    aiMetaTags: [...aiMetaTags], hasNoindex, canonical, hasOg,
    imgCount: imgs.length, imgsWithAlt, headingLevels,
  };
}

function classifyPageType(urlString) {
  const path = new URL(urlString).pathname.toLowerCase();
  if (path === "/" || path === "") return "home";
  if (/(^|\/)pricing(\/|$)/.test(path)) return "pricing";
  if (/(^|\/)(product|products|features)(\/|$)/.test(path)) return "product";
  if (/(^|\/)(docs|documentation|guide|api)(\/|$)/.test(path)) return "docs";
  if (/(^|\/)(blog|news|article|articles)(\/|$)/.test(path)) return "blog";
  if (/(^|\/)(about|company|team)(\/|$)/.test(path)) return "about";
  if (/(^|\/)(contact|support)(\/|$)/.test(path)) return "contact";
  return "other";
}

// ─── Per-page deterministic checks ───────────────────────────────────────────

export function scorePageChecks(v) {
  const checks = [];
  const foundTypes = v.schemaTypes.filter((t) => RECOGNIZED_SCHEMA_TYPES.includes(t));

  let headingSkipped = false;
  for (let i = 1; i < v.headingLevels.length; i += 1) {
    if (v.headingLevels[i] - v.headingLevels[i - 1] > 1) { headingSkipped = true; break; }
  }
  const uniqueLevels = new Set(v.headingLevels).size;
  const altRatio = v.imgCount === 0 ? 1 : v.imgsWithAlt / v.imgCount;

  checks.push({ id: "title", label: "Clear page title", passed: v.title.length >= 10, points: 10,
    details: v.title ? `Found title (${v.title.length} chars).` : "No <title> found." });
  checks.push({ id: "meta-description", label: "Meta description", passed: v.metaDescription.length >= 50, points: 10,
    details: v.metaDescription ? `Found description (${v.metaDescription.length} chars).` : "No meta description found." });
  checks.push({ id: "canonical", label: "Canonical URL", passed: v.canonical.length > 0, points: 8,
    details: v.canonical ? `Canonical: ${v.canonical}` : "No canonical tag found." });
  checks.push({ id: "h1", label: "Single H1 heading", passed: v.h1Count === 1, points: 8,
    details: `Found ${v.h1Count} h1 tag(s).` });
  checks.push({ id: "schema", label: "Structured data present", passed: v.jsonLdCount > 0, points: 8,
    details: v.jsonLdCount > 0 ? `Found ${v.jsonLdCount} JSON-LD block(s).` : "No JSON-LD structured data found." });
  checks.push({ id: "schema-types", label: "Schema types identified", passed: foundTypes.length > 0, points: 8,
    details: foundTypes.length > 0 ? `Types: ${foundTypes.join(", ")}` : "No recognized @type found in JSON-LD." });
  checks.push({ id: "og", label: "Open Graph basics", passed: v.hasOg, points: 8,
    details: v.hasOg ? "og:title and og:description found." : "Missing og:title and/or og:description." });
  checks.push({ id: "internal-links", label: "Internal linking", passed: v.internalLinkCount >= 5, points: 10,
    details: `Found ${v.internalLinkCount} internal links.` });
  checks.push({ id: "image-alt", label: "Image alt coverage", passed: altRatio >= 0.8, points: 8,
    details: v.imgCount === 0 ? "No images on page." : `${v.imgsWithAlt}/${v.imgCount} images include alt text.` });
  checks.push({ id: "text-depth", label: "Readable content depth", passed: v.bodyWordCount >= 250, points: 12,
    details: `Estimated ${v.bodyWordCount} words in body text.` });
  checks.push({ id: "indexability", label: "Indexable for discovery", passed: !v.hasNoindex, points: 10,
    details: v.hasNoindex ? "Page has noindex directive." : "No noindex directive found." });
  checks.push({ id: "ai-meta-tags", label: "AI-accessible meta tags", passed: v.aiMetaTags.length === 0, points: 6,
    details: v.aiMetaTags.length === 0 ? "No restrictive AI meta tags." : `Restrictive tags: ${v.aiMetaTags.join(", ")}` });
  checks.push({ id: "heading-hierarchy", label: "Content structure",
    passed: !headingSkipped && v.headingLevels.length > 0 && uniqueLevels >= 2, points: 6,
    details: v.headingLevels.length === 0
      ? "No headings found — AI agents have no structural anchors to chunk content."
      : uniqueLevels < 2
        ? "Only one heading level used — content lacks topic segmentation for AI chunking."
        : headingSkipped
          ? "Heading levels skipped — weakens the content outline AI agents use for extraction."
          : `Clean heading structure (${uniqueLevels} levels) — easy for AI agents to chunk and cite.` });

  const score = checks.reduce((s, c) => s + (c.passed ? c.points : 0), 0);
  const maxScore = checks.reduce((s, c) => s + c.points, 0);
  return { checks, score, maxScore };
}

function makeSummary(pct) {
  if (pct >= 80) return "Strong for AI agents. Improve a few weak signals to harden performance.";
  if (pct >= 60) return "Decent base, but key machine-readable signals are missing.";
  if (pct >= 40) return "Needs work. AI agents may miss context or trust signals.";
  return "High risk for AI interpretation. Prioritize technical and content structure fixes.";
}

// ─── Crawl ───────────────────────────────────────────────────────────────────

async function crawlSite(startUrl, maxPages) {
  const start = new URL(startUrl);
  const robotsPolicy = await fetchRobotsPolicy(start);
  const sitemapUrls = await fetchSitemapUrls(start, robotsPolicy, Math.min(maxPages * 8, 400));

  const queue = [startUrl, ...sitemapUrls.filter((u) => u !== startUrl)];
  const seen = new Set(queue);
  const pages = [];
  let robotsBlockedCount = 0;
  let failedPages = 0;
  let startPageHtml = "";

  async function processUrl(currentUrl, isFirst) {
    try {
      const url = new URL(currentUrl);
      if (!isPathAllowed(url.pathname || "/", robotsPolicy)) {
        robotsBlockedCount += 1;
        return;
      }
      const html = await fetchText(currentUrl);
      if (isFirst) startPageHtml = html;
      const aiView = extractAiView(html, url);
      const { checks, score, maxScore } = scorePageChecks(aiView);
      pages.push({
        url: currentUrl, score, maxScore,
        summary: makeSummary(Math.round((score / maxScore) * 100)),
        checks, aiView, pageType: classifyPageType(currentUrl),
      });
      for (const link of extractInternalLinks(html, url, start.host, robotsPolicy)) {
        if (pages.length + queue.length >= maxPages * 4) break;
        if (seen.has(link)) continue;
        seen.add(link);
        queue.push(link);
      }
    } catch {
      failedPages += 1;
    }
  }

  // Start URL first (serial) so we can capture startPageHtml.
  const firstUrl = queue.shift();
  if (firstUrl) await processUrl(firstUrl, true);

  // Drain remaining URLs with bounded concurrency.
  while (queue.length > 0 && pages.length < maxPages) {
    const batch = [];
    while (batch.length < CRAWL_CONCURRENCY && queue.length > 0 && pages.length + batch.length < maxPages) {
      const next = queue.shift();
      if (next) batch.push(next);
    }
    if (batch.length === 0) break;
    await Promise.all(batch.map((u) => processUrl(u, false)));
  }

  return {
    pageAudits: pages,
    robotsFound: robotsPolicy.found,
    robotsBlockedCount,
    discoveredFromSitemap: Math.min(sitemapUrls.length, maxPages),
    failedPages,
    robotsPolicy,
    startPageHtml,
  };
}

// ─── Site-wide aggregation ───────────────────────────────────────────────────

export function aggregateChecks(pageAudits) {
  const byId = new Map();
  for (const page of pageAudits) {
    for (const check of page.checks) {
      const row = byId.get(check.id) ?? { label: check.label, points: check.points, passCount: 0, total: 0 };
      row.total += 1;
      if (check.passed) row.passCount += 1;
      byId.set(check.id, row);
    }
  }
  return [...byId.entries()].map(([id, row]) => ({
    id, label: row.label, points: row.points,
    passed: row.total > 0 && row.passCount / row.total >= 0.8,
    details: `${row.passCount}/${row.total} pages passed this check.`,
  }));
}

export function buildCoverage(pageAudits) {
  const map = new Map();
  for (const page of pageAudits) {
    const row = map.get(page.pageType) ?? { pages: 0, scoreSum: 0 };
    row.pages += 1;
    row.scoreSum += Math.round((page.score / page.maxScore) * 100);
    map.set(page.pageType, row);
  }
  return [...map.entries()]
    .map(([pageType, row]) => ({ pageType, pages: row.pages, avgScore: Math.round(row.scoreSum / row.pages) }))
    .sort((a, b) => b.pages - a.pages);
}

export function buildPrioritizedFixes(checks, coverage, llmsValid, blockedBots) {
  const fixes = [];
  const byId = new Map(checks.map((c) => [c.id, c]));
  const failed = (id) => !byId.get(id)?.passed;

  if (blockedBots.length > 0) fixes.push({ title: "Unblock major AI crawlers in robots.txt", impact: "High", effort: "Low",
    why: `You're blocking ${blockedBots.join(", ")} — these bots can't index your content.` });
  if (failed("ai-meta-tags")) fixes.push({ title: "Remove restrictive AI meta tags", impact: "High", effort: "Low",
    why: "Tags like nosnippet and noai prevent AI systems from using your content." });
  if (failed("schema")) fixes.push({ title: "Add structured data (JSON-LD) on key templates", impact: "High", effort: "Medium",
    why: "Agents rely on machine-readable entities and page intent signals." });
  if (failed("meta-description") || failed("title")) fixes.push({ title: "Standardize title and meta description quality", impact: "High", effort: "Low",
    why: "Weak metadata reduces retrieval accuracy and snippet quality." });
  if (failed("text-depth")) fixes.push({ title: "Expand answer-first content on thin pages", impact: "High", effort: "Medium",
    why: "Agents need enough explicit facts and context to answer safely." });
  if (failed("internal-links")) fixes.push({ title: "Improve internal linking between key pages", impact: "Medium", effort: "Low",
    why: "Better graph connectivity improves crawl and context propagation." });
  if (!llmsValid) fixes.push({ title: "Publish a valid llms.txt with heading, links, and policy info", impact: "Medium", effort: "Low",
    why: "It gives AI systems a direct index of trusted URLs and constraints." });
  if (failed("rss-feed")) fixes.push({ title: "Add an RSS or Atom feed", impact: "Medium", effort: "Low",
    why: "RSS feeds help AI systems discover and track new content." });
  if (failed("heading-hierarchy")) fixes.push({ title: "Improve content structure with clear heading levels", impact: "Medium", effort: "Low",
    why: "Well-structured H1 → H2 → H3 outlines help AI agents chunk, extract, and cite specific sections." });
  if (failed("schema-types")) fixes.push({ title: "Add recognized schema types to JSON-LD", impact: "Medium", effort: "Medium",
    why: "Named types like Organization, Product, Article help AI classify your content." });
  if (!coverage.some((c) => c.pageType === "docs")) fixes.push({ title: "Create a docs/knowledge section for product facts", impact: "Medium", effort: "Medium",
    why: "A stable docs corpus helps agents extract precise answers." });

  return fixes.slice(0, 8);
}

// ─── Heuristic intelligence prior (deterministic) ────────────────────────────

function tokenize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length >= 4);
}
function overlap(a, b) {
  if (a.length === 0 || b.length === 0) return 0;
  const aSet = new Set(a);
  const bSet = new Set(b);
  let inter = 0;
  for (const t of aSet) if (bSet.has(t)) inter += 1;
  return inter / Math.max(1, Math.min(aSet.size, bSet.size));
}
function intentAlignment(page) {
  const titleTokens = tokenize(page.aiView.title);
  return average([
    overlap(titleTokens, tokenize(page.aiView.metaDescription)),
    overlap(titleTokens, tokenize(page.aiView.h1[0] || "")),
  ]);
}
function checkPassRatio(pageAudits, id) {
  if (pageAudits.length === 0) return 0;
  return pageAudits.filter((p) => p.checks.find((c) => c.id === id)?.passed).length / pageAudits.length;
}
const scoreStatus = (s) => (s >= 80 ? "Strong" : s >= 60 ? "Moderate" : "Weak");
const priorityFromScore = (s) => (s < 45 ? "Critical" : s < 65 ? "High ROI" : s < 82 ? "Quick Win" : "Monitor");

export function buildIntelligenceSignals(ctx) {
  const { pageAudits, coverage, blockedBots, rssFeedFound, discoveredFromSitemap, failedPages, maxPages } = ctx;
  const total = Math.max(1, pageAudits.length);
  const titleRatio = pageAudits.filter((p) => p.aiView.title.length >= 20).length / total;
  const metaRatio = pageAudits.filter((p) => p.aiView.metaDescription.length >= 80).length / total;
  const singleH1Ratio = pageAudits.filter((p) => p.aiView.h1Count === 1).length / total;
  const textDepthRatio = checkPassRatio(pageAudits, "text-depth");
  const headingHierarchyRatio = checkPassRatio(pageAudits, "heading-hierarchy");
  const indexableRatio = checkPassRatio(pageAudits, "indexability");
  const alignmentRatio = average(pageAudits.map(intentAlignment));
  const avgInternalLinks = average(pageAudits.map((p) => p.aiView.internalLinkCount));
  const internalLinksNorm = clamp01(avgInternalLinks / 12);
  const templateDiversity = clamp01(coverage.length / 5);
  const sitemapDiscovery = clamp01(discoveredFromSitemap / Math.max(1, maxPages));
  const crawlSuccess = clamp01(1 - failedPages / Math.max(1, failedPages + pageAudits.length));
  const numericEvidenceRatio = pageAudits.filter((p) => /\d/.test(p.aiView.textExcerpt)).length / total;
  const headingRichRatio = pageAudits.filter((p) => p.aiView.headings.length >= 4).length / total;
  const faqHeadingRatio = pageAudits.filter((p) => p.aiView.headings.some((h) => /\?|FAQ|how to|what is|guide/i.test(h))).length / total;
  const answerFirstRatio = pageAudits.filter((p) =>
    /\bis\b|\bare\b|\bwas\b|\bmeans\b|\brefers to\b|\bdefined as\b/i.test((p.aiView.textExcerpt || "").slice(0, 200))
  ).length / total;
  const hasDateSignals = pageAudits.filter((p) => p.aiView.publishedDate || p.aiView.modifiedDate).length / total;
  const hasAuthorRatio = pageAudits.filter((p) => !!p.aiView.author).length / total;

  const base = [
    { id: "answer-readiness", signal: "Answer Readiness",
      score: scoreToInt(30 * faqHeadingRatio + 30 * answerFirstRatio + 20 * metaRatio + 20 * textDepthRatio),
      rationale: "Does the content lead with direct answers to questions agents get asked?",
      keyFinding: `${Math.round(faqHeadingRatio * 100)}% pages have Q&A-style headings; ${Math.round(answerFirstRatio * 100)}% lead with definitions.` },
    { id: "quotability", signal: "Quotability",
      score: scoreToInt(30 * headingRichRatio + 25 * textDepthRatio + 25 * headingHierarchyRatio + 20 * alignmentRatio),
      rationale: "Can an agent extract clean, self-contained passages to quote as citations?",
      keyFinding: `${Math.round(headingRichRatio * 100)}% pages have rich headings; ${Math.round(textDepthRatio * 100)}% meet depth threshold.` },
    { id: "evidence-density", signal: "Evidence Density",
      score: scoreToInt(35 * numericEvidenceRatio + 25 * hasAuthorRatio + 20 * textDepthRatio + 20 * internalLinksNorm),
      rationale: "Density of statistics, data points, named sources, and in-text citations.",
      keyFinding: `${Math.round(numericEvidenceRatio * 100)}% pages include numeric evidence; ${Math.round(hasAuthorRatio * 100)}% have author attribution.` },
    { id: "content-depth", signal: "Content Depth",
      score: scoreToInt(35 * textDepthRatio + 25 * templateDiversity + 25 * internalLinksNorm + 15 * headingRichRatio),
      rationale: "Substantive long-form content that covers topics with depth and breadth.",
      keyFinding: `${Math.round(textDepthRatio * 100)}% pages meet depth threshold across ${coverage.length} template types.` },
    { id: "freshness", signal: "Freshness",
      score: scoreToInt(30 * hasDateSignals + 25 * (rssFeedFound ? 1 : 0) + 20 * sitemapDiscovery + 15 * crawlSuccess + 10 * indexableRatio),
      rationale: "Date signals, update timestamps, and active maintenance indicators.",
      keyFinding: `${Math.round(hasDateSignals * 100)}% pages have date signals; ${rssFeedFound ? "RSS feed found" : "no RSS feed"}.` },
    { id: "structural-clarity", signal: "Structural Clarity",
      score: scoreToInt(30 * headingHierarchyRatio + 25 * titleRatio + 25 * singleH1Ratio + 20 * headingRichRatio),
      rationale: "Clean semantic HTML structure that survives extraction to markdown.",
      keyFinding: `${Math.round(headingHierarchyRatio * 100)}% clean heading hierarchy; ${Math.round(singleH1Ratio * 100)}% have single H1.` },
  ];
  return base
    .map((s) => ({ ...s, status: scoreStatus(s.score), fixPriority: priorityFromScore(s.score) }))
    .sort((a, b) => a.score - b.score);
}

// ─── Page selection for LLM review ───────────────────────────────────────────

function pageRichness(p) {
  let score = (p.aiView.textExcerpt?.length || 0) / 200;
  if (p.aiView.schemaTypes.length) score += 3;
  if (p.aiView.jsonLdSummary) score += 2;
  if (p.aiView.author) score += 2;
  if (p.aiView.publishedDate || p.aiView.modifiedDate) score += 2;
  score += Math.min(p.aiView.headings.length, 6);
  if (["blog", "docs", "product"].includes(p.pageType)) score += 4;
  if (["pricing", "other"].includes(p.pageType)) score += 2;
  return score;
}
function selectPages(pageAudits, max) {
  const home = pageAudits.find((p) => p.pageType === "home");
  const others = pageAudits
    .filter((p) => p.pageType !== "home")
    .sort((a, b) => pageRichness(b) - pageRichness(a));
  const ordered = [...(home ? [home] : []), ...others];
  const seen = new Set();
  return ordered.filter((p) => (seen.has(p.url) ? false : (seen.add(p.url), true))).slice(0, max);
}

// ─── Grade ───────────────────────────────────────────────────────────────────

export function letterGrade(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 40) return "D";
  return "F";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.url) {
    console.log(`AEO Audit — website AI-discoverability auditor

Usage:
  node aeo-audit.mjs <url> [--max-pages=10] [--out=aeo-audit-report.json] [--json]

Options:
  --max-pages=N   Pages to crawl (default 10, max ${MAX_CRAWL_LIMIT})
  --out=PATH      JSON report path (default aeo-audit-report.json)
  --no-out        Do not write a JSON file
  --json          Print the full JSON report to stdout instead of a summary
`);
    process.exit(args.url ? 0 : 1);
  }

  let normalized;
  try {
    normalized = normalizeUrl(args.url);
  } catch {
    console.error(`Invalid URL: ${args.url}`);
    process.exit(1);
  }
  const maxPages = Math.max(1, Math.min(MAX_CRAWL_LIMIT, args.maxPages));

  if (!args.json) console.error(`Crawling ${normalized} (up to ${maxPages} pages)…`);

  const startTime = Date.now();
  const [crawlResult, llmsTxtResult] = await Promise.all([
    crawlSite(normalized, maxPages),
    validateLlmsTxt(new URL(normalized)),
  ]);

  if (crawlResult.pageAudits.length === 0) {
    console.error(`Could not crawl any pages from ${normalized}.`);
    process.exit(1);
  }

  const rssFeedFound = await detectRssFeed(crawlResult.startPageHtml, new URL(normalized));
  const checks = aggregateChecks(crawlResult.pageAudits);

  const llmsValid = isLlmsTxtValid(llmsTxtResult);
  checks.push({
    id: "llms-txt", label: "llms.txt valid", passed: llmsValid, points: 10,
    details: !llmsTxtResult.found
      ? "No llms.txt found."
      : llmsValid
        ? `Valid llms.txt (${llmsTxtResult.contentLength} chars)${llmsTxtResult.fullTxtFound ? " + llms-full.txt" : ""}.`
        : `Found llms.txt but ${!llmsTxtResult.hasH1 ? "missing # heading" : !llmsTxtResult.hasLink ? "missing links" : "too short"}.`,
  });

  const blockedBots = crawlResult.robotsPolicy.aiBotBlocked;
  checks.push({
    id: "ai-bot-access", label: "AI bot access", passed: blockedBots.length === 0, points: 12,
    details: blockedBots.length === 0 ? "No AI bots blocked in robots.txt." : `Blocked: ${blockedBots.join(", ")}`,
  });
  checks.push({
    id: "rss-feed", label: "RSS/Atom feed", passed: rssFeedFound, points: 8,
    details: rssFeedFound ? "RSS or Atom feed detected." : "No RSS/Atom feed found.",
  });

  const coverage = buildCoverage(crawlResult.pageAudits);
  const prioritizedFixes = buildPrioritizedFixes(checks, coverage, llmsValid, blockedBots);
  const intelligenceSignals = buildIntelligenceSignals({
    pageAudits: crawlResult.pageAudits, coverage, blockedBots, rssFeedFound,
    discoveredFromSitemap: crawlResult.discoveredFromSitemap,
    failedPages: crawlResult.failedPages, maxPages,
  });

  const earnedPoints = checks.reduce((s, c) => s + (c.passed ? c.points : 0), 0);
  const maxPoints = checks.reduce((s, c) => s + c.points, 0);
  const foundationalScore = scoreToInt((earnedPoints / Math.max(1, maxPoints)) * 100);
  const heuristicIntelligenceScore = scoreToInt(average(intelligenceSignals.map((s) => s.score)));
  const provisionalScore = scoreToInt(0.5 * foundationalScore + 0.5 * heuristicIntelligenceScore);

  const worstPages = crawlResult.pageAudits
    .slice()
    .sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)
    .slice(0, 5)
    .map((p) => ({ url: p.url, score: p.score, maxScore: p.maxScore, pageType: p.pageType }));

  const pagesForReview = selectPages(crawlResult.pageAudits, 5).map((p) => ({
    url: p.url, pageType: p.pageType, score: p.score, maxScore: p.maxScore, aiView: p.aiView,
  }));

  const report = {
    url: normalized,
    generatedAt: new Date().toISOString(),
    crawledPages: crawlResult.pageAudits.length,
    maxPages,
    scoring: {
      foundationalScore,
      heuristicIntelligenceScore,
      provisionalScore,
      provisionalGrade: letterGrade(provisionalScore),
      note: "provisionalScore uses a deterministic heuristic for the intelligence half. " +
        "The agent should replace heuristicIntelligenceScore with its own 6-dimension LLM evaluation, " +
        "then compute finalScore = round(0.5*foundationalScore + 0.5*llmIntelligenceScore).",
    },
    checks,
    coverage,
    prioritizedFixes,
    worstPages,
    diagnostics: {
      crawlMs: Date.now() - startTime,
      robotsFound: crawlResult.robotsFound,
      robotsBlockedCount: crawlResult.robotsBlockedCount,
      discoveredFromSitemap: crawlResult.discoveredFromSitemap,
      failedPages: crawlResult.failedPages,
    },
    robots: {
      found: crawlResult.robotsFound,
      aiBotBlocked: blockedBots,
      sitemapCount: crawlResult.discoveredFromSitemap,
    },
    llmsTxt: llmsTxtResult,
    rssFeed: rssFeedFound,
    heuristicIntelligenceSignals: intelligenceSignals,
    pagesForReview,
    pageAudits: crawlResult.pageAudits,
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    printSummary(report);
  }

  if (args.out) {
    writeFileSync(args.out, JSON.stringify(report, null, 2));
    if (!args.json) console.error(`\nFull JSON report written to ${args.out}`);
  }
}

function printSummary(r) {
  const line = "─".repeat(60);
  console.log(`\n${line}`);
  console.log(`  AEO AUDIT — ${r.url}`);
  console.log(line);
  console.log(`  Pages crawled:           ${r.crawledPages} / ${r.maxPages}`);
  console.log(`  Foundational score:      ${r.scoring.foundationalScore}/100  (16 deterministic checks)`);
  console.log(`  Heuristic intelligence:  ${r.scoring.heuristicIntelligenceScore}/100  (deterministic prior)`);
  console.log(`  Provisional score:       ${r.scoring.provisionalScore}/100  → grade ${r.scoring.provisionalGrade}`);
  console.log(`  (Final score requires the agent's 6-dimension evaluation — see SKILL.md)`);

  const failed = r.checks.filter((c) => !c.passed);
  console.log(`\n  CHECKS: ${r.checks.length - failed.length}/${r.checks.length} passed site-wide`);
  for (const c of r.checks) {
    console.log(`   ${c.passed ? "✓" : "✗"} ${c.label} (${c.points} pts) — ${c.details}`);
  }

  if (r.robots.aiBotBlocked.length > 0) {
    console.log(`\n  ⚠ AI BOTS BLOCKED IN robots.txt: ${r.robots.aiBotBlocked.join(", ")}`);
  }

  if (r.prioritizedFixes.length > 0) {
    console.log(`\n  PRIORITIZED FIXES:`);
    r.prioritizedFixes.forEach((f, i) => {
      console.log(`   ${i + 1}. [${f.impact} impact / ${f.effort} effort] ${f.title}`);
      console.log(`      ${f.why}`);
    });
  }

  if (r.worstPages.length > 0) {
    console.log(`\n  WEAKEST PAGES:`);
    for (const p of r.worstPages) {
      console.log(`   ${Math.round((p.score / p.maxScore) * 100)}%  ${p.url}`);
    }
  }

  console.log(`\n  HEURISTIC INTELLIGENCE SIGNALS (deterministic prior):`);
  for (const s of r.heuristicIntelligenceSignals) {
    console.log(`   ${s.score}/100 ${s.status.padEnd(8)} ${s.signal} — ${s.keyFinding}`);
  }
  console.log(line);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(`Audit failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
}
