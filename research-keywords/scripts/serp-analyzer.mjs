#!/usr/bin/env node

/**
 * SERP Analyzer — Check real SERP competition for a list of keywords
 *
 * Takes keywords (from keyword-explorer output or manual list) and checks:
 * - What SERP features appear (AI Overview, Featured Snippet, PAA, etc.)
 * - Who currently ranks in the top results
 * - Content gaps and opportunities
 *
 * Requires SERPAPI_KEY (free tier: 100 searches/month at serpapi.com)
 *
 * Alternative provider: GoAnyAPI (https://goanyapi.com). With
 * `--provider goanyapi` and GOANYAPI_API_KEY set, SERP data comes from the
 * GoAnyAPI SERP Stable edition (GET /api/v1/serp-stable, 1 credit/request).
 *
 * Usage:
 *   # Analyze keywords from explorer output
 *   SERPAPI_KEY=xxx node serp-analyzer.mjs --input keyword-explorer-results.json --top 20
 *
 *   # Analyze specific keywords
 *   SERPAPI_KEY=xxx node serp-analyzer.mjs --keywords "what is DePAI, physical AI companies, best AI robotics crypto"
 *
 *   # Analyze with competitor domain tracking
 *   SERPAPI_KEY=xxx node serp-analyzer.mjs --keywords "what is DePAI" --track "axisrobotics.ai,bittensor.com"
 *
 *   # Analyze with GoAnyAPI as the SERP provider
 *   GOANYAPI_API_KEY=xxx node serp-analyzer.mjs --keywords "what is DePAI" --provider goanyapi
 */

import https from "https";
import http from "http";
import fs from "fs";
import { URLSearchParams } from "url";

const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
const GOANYAPI_API_KEY = process.env.GOANYAPI_API_KEY || "";
// Overridable for testing/proxying; must point at a GoAnyAPI-compatible host.
const GOANYAPI_BASE_URL = process.env.GOANYAPI_BASE_URL || "https://api.goanyapi.com";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: null,
    keywords: [],
    top: 10,
    track: [],
    out: null,
    gl: "us",
    hl: "en",
    provider: "serpapi", // "serpapi" | "goanyapi"
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input":
      case "-i":
        opts.input = args[++i];
        break;
      case "--keywords":
      case "-k":
        opts.keywords = args[++i].split(",").map((s) => s.trim());
        break;
      case "--top":
      case "-t":
        opts.top = parseInt(args[++i], 10);
        break;
      case "--track":
        opts.track = args[++i].split(",").map((s) => s.trim().toLowerCase());
        break;
      case "--out":
      case "-o":
        opts.out = args[++i];
        break;
      case "--gl":
        opts.gl = args[++i];
        break;
      case "--hl":
        opts.hl = args[++i];
        break;
      case "--provider":
      case "-p":
        opts.provider = args[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  if (opts.provider !== "serpapi" && opts.provider !== "goanyapi") {
    console.error(`Error: unknown provider "${opts.provider}". Use "serpapi" or "goanyapi".`);
    process.exit(1);
  }

  if (opts.provider === "goanyapi") {
    if (!GOANYAPI_API_KEY) {
      console.error("Error: --provider goanyapi requires the GOANYAPI_API_KEY environment variable.");
      console.error("Get a key at https://goanyapi.com (SERP Stable: 1 credit per request).");
      process.exit(1);
    }
  } else if (!SERPAPI_KEY) {
    console.error("Error: SERPAPI_KEY environment variable is required.");
    console.error("Get a free key at https://serpapi.com (100 searches/month).");
    process.exit(1);
  }

  if (!opts.input && opts.keywords.length === 0) {
    console.error("Error: --input or --keywords is required. Use --help for usage.");
    process.exit(1);
  }

  return opts;
}

function printHelp() {
  console.log(`
SERP Analyzer — Check real SERP competition for keywords

Usage:
  SERPAPI_KEY=xxx node serp-analyzer.mjs --keywords "keyword1, keyword2"
  SERPAPI_KEY=xxx node serp-analyzer.mjs --input explorer-results.json --top 20
  GOANYAPI_API_KEY=xxx node serp-analyzer.mjs --keywords "keyword1, keyword2" --provider goanyapi

Options:
  --input, -i     Path to keyword-explorer JSON output file
  --keywords, -k  Comma-separated keywords to analyze
  --top, -t       How many keywords to analyze from input file (default: 10)
  --track         Comma-separated domains to track in results (e.g., "axisrobotics.ai,bittensor.com")
  --provider, -p  SERP provider: serpapi (default) or goanyapi
  --out, -o       Output file path (default: serp-analysis-{timestamp}.json)
  --gl            Country code (default: us)
  --hl            Language code (default: en)
  --help, -h      Show this help

Environment:
  SERPAPI_KEY       Your SerpAPI key (required for the default provider, free tier: serpapi.com)
  GOANYAPI_API_KEY  Your GoAnyAPI key (goanyapi.com; SERP Stable: 1 credit/request)
  GOANYAPI_BASE_URL Optional. Override the GoAnyAPI API base URL (for testing)
  `);
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Parse error: ${data.slice(0, 200)}`));
          }
        });
      })
      .on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function goanyapiGet(path, params) {
  const qs = new URLSearchParams(params).toString();
  const parsedUrl = new URL(`${GOANYAPI_BASE_URL}${path}?${qs}`);
  const transport = parsedUrl.protocol === "http:" ? http : https;
  return new Promise((resolve, reject) => {
    transport
      .get(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || undefined,
          path: parsedUrl.pathname + parsedUrl.search,
          headers: {
            Authorization: `Bearer ${GOANYAPI_API_KEY}`,
            Accept: "application/json",
            "User-Agent": "SerpAnalyzer/1.0",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject(
                new Error(
                  `GoAnyAPI ${path} failed (HTTP ${res.statusCode}): ${data.slice(0, 200)}`
                )
              );
              return;
            }
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(
                new Error(`Failed to parse JSON from ${path}: ${data.slice(0, 200)}`)
              );
            }
          });
        }
      )
      .on("error", reject);
  });
}

// Map GoAnyAPI serp_features `type` values onto the SerpAPI-style feature
// names used in reports. Unknown types are kept as-is so new modules still
// surface instead of being dropped.
function mapGoAnyApiFeatureType(type) {
  const t = String(type || "").toLowerCase();
  if (t === "people_also_ask") return "people_also_ask";
  if (t === "related_searches" || t === "related_search") return "related_search";
  if (t.includes("ai_overview") || t === "aio") return "ai_overview";
  if (t.includes("snippet") || t === "answer_box") return "featured_snippet";
  if (t.includes("knowledge")) return "knowledge_graph";
  if (t.includes("news") || t === "top_stories") return "top_stories";
  if (t.includes("video")) return "video_results";
  if (t.includes("shop")) return "shopping";
  if (t.includes("local") || t === "places") return "local_pack";
  return t || null;
}

async function analyzeSERP(keyword, gl, hl, provider = "serpapi") {
  if (provider === "goanyapi") {
    return analyzeSERPGoAnyApi(keyword, gl, hl);
  }
  return analyzeSERPSerpApi(keyword, gl, hl);
}

async function analyzeSERPSerpApi(keyword, gl, hl) {
  const params = new URLSearchParams({
    api_key: SERPAPI_KEY,
    engine: "google",
    q: keyword,
    gl,
    hl,
    num: 10,
  });

  const data = await fetchJSON(`https://serpapi.com/search.json?${params}`);

  const analysis = {
    keyword,
    features: [],
    organicResults: [],
    domains: [],
    aiOverview: null,
    featuredSnippet: null,
    paaQuestions: [],
    relatedSearches: [],
    difficulty: "unknown",
  };

  // SERP Features
  if (data.ai_overview) {
    analysis.features.push("ai_overview");
    analysis.aiOverview = {
      text: data.ai_overview.text_blocks
        ?.map((b) => b.snippet || b.text || "")
        .join(" ")
        .slice(0, 300),
      sources: (data.ai_overview.references || data.ai_overview.organic_results || [])
        .slice(0, 5)
        .map((r) => ({
          title: r.title,
          link: r.link,
          domain: r.source || extractDomain(r.link),
        })),
    };
  }

  if (data.answer_box) {
    analysis.features.push("featured_snippet");
    analysis.featuredSnippet = {
      type: data.answer_box.type || "paragraph",
      snippet: (data.answer_box.snippet || data.answer_box.answer || "").slice(0, 300),
      source: data.answer_box.link || "",
      domain: extractDomain(data.answer_box.link || ""),
    };
  }

  if (data.knowledge_graph) analysis.features.push("knowledge_graph");
  if (data.related_questions?.length) analysis.features.push("people_also_ask");
  if (data.top_stories) analysis.features.push("top_stories");
  if (data.video_results?.length) analysis.features.push("video_results");
  if (data.shopping_results?.length) analysis.features.push("shopping");

  // PAA
  if (data.related_questions) {
    analysis.paaQuestions = data.related_questions.map((q) => q.question);
  }

  // Related Searches
  if (data.related_searches) {
    analysis.relatedSearches = data.related_searches.map((r) => r.query);
  }

  // Organic Results
  if (data.organic_results) {
    analysis.organicResults = data.organic_results.slice(0, 10).map((r, i) => ({
      position: i + 1,
      title: r.title,
      link: r.link,
      domain: extractDomain(r.link),
      snippet: (r.snippet || "").slice(0, 200),
    }));
    analysis.domains = analysis.organicResults.map((r) => r.domain);
  }

  // Simple difficulty estimation
  analysis.difficulty = estimateDifficulty(analysis);

  return analysis;
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

async function analyzeSERPGoAnyApi(keyword, gl, hl) {
  // SERP Stable edition: `query` (not `q`), 1 credit per successful request.
  const payload = await goanyapiGet("/api/v1/serp-stable", {
    query: keyword,
    gl,
    hl,
  });
  if (payload.code && payload.code !== "ok") {
    throw new Error(
      `GoAnyAPI serp-stable error: ${payload.message || payload.code}`
    );
  }

  const result = payload?.data?.result || {};
  const features = Array.isArray(result.serp_features)
    ? result.serp_features
    : [];

  const analysis = {
    keyword,
    features: [],
    organicResults: [],
    domains: [],
    aiOverview: null,
    featuredSnippet: null,
    paaQuestions: [],
    relatedSearches: [],
    difficulty: "unknown",
  };

  const paaItems = [];
  const relatedItems = [];

  for (const feature of features) {
    const mapped = mapGoAnyApiFeatureType(feature.type);
    if (!mapped) continue;
    if (!analysis.features.includes(mapped)) analysis.features.push(mapped);

    const items = Array.isArray(feature.items) ? feature.items : [];
    const links = Array.isArray(feature.links) ? feature.links : [];

    if (mapped === "people_also_ask") {
      for (const it of items) {
        const q = it.title || it.text || "";
        if (q) paaItems.push(q);
      }
    }

    if (mapped === "related_search") {
      for (const it of items) {
        const rs = it.title || it.text || "";
        if (rs) relatedItems.push(rs);
      }
    }

    if (mapped === "ai_overview" && !analysis.aiOverview) {
      const text = (
        feature.text ||
        items.map((it) => it.text || it.title || "").join(" ")
      ).slice(0, 300);
      const sources = links
        .slice(0, 5)
        .map((l) => ({
          title: l.title || "",
          link: l.link || l.url || "",
          domain: extractDomain(l.link || l.url || ""),
        }))
        .filter((s) => s.link);
      analysis.aiOverview = { text, sources };
    }

    if (mapped === "featured_snippet" && !analysis.featuredSnippet) {
      const firstLink = links[0]?.link || links[0]?.url || items[0]?.link || "";
      analysis.featuredSnippet = {
        type: feature.title || "paragraph",
        snippet: (feature.text || items[0]?.text || "").slice(0, 300),
        source: firstLink,
        domain: extractDomain(firstLink || ""),
      };
    }
  }

  analysis.paaQuestions = paaItems;
  analysis.relatedSearches = relatedItems;

  // Organic results
  const organic = (Array.isArray(result.results) ? result.results : [])
    .filter((r) => !r.type || r.type === "organic")
    .slice(0, 10);
  analysis.organicResults = organic.map((r, i) => ({
    position: r.rank || i + 1,
    title: r.title || "",
    link: r.url || "",
    domain: extractDomain(r.url || ""),
    snippet: (r.snippet || "").slice(0, 200),
  }));
  analysis.domains = analysis.organicResults.map((r) => r.domain);

  // Simple difficulty estimation
  analysis.difficulty = estimateDifficulty(analysis);

  return analysis;
}

function estimateDifficulty(analysis) {
  // Simple heuristic based on who ranks
  const domains = analysis.domains;
  const bigDomains = [
    "nvidia.com", "ibm.com", "microsoft.com", "google.com", "deloitte.com",
    "wikipedia.org", "amazon.com", "forbes.com", "techcrunch.com",
    "coinmarketcap.com", "coingecko.com", "coindesk.com",
  ];

  const bigCount = domains.filter((d) =>
    bigDomains.some((bd) => d.includes(bd))
  ).length;

  if (bigCount >= 5) return "hard";
  if (bigCount >= 3) return "medium";
  if (bigCount >= 1) return "easy-medium";
  return "easy";
}

function printReport(results, trackedDomains) {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                   SERP ANALYSIS REPORT                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Summary table
  console.log("┌─────────────────────────────────────────────┬────────────┬──────────────────────────────────┐");
  console.log("│ Keyword                                     │ Difficulty │ SERP Features                    │");
  console.log("├─────────────────────────────────────────────┼────────────┼──────────────────────────────────┤");

  for (const r of results) {
    const kw = r.keyword.slice(0, 43).padEnd(43);
    const diff = r.difficulty.padEnd(10);
    const features = r.features.join(", ").slice(0, 32).padEnd(32);
    console.log(`│ ${kw} │ ${diff} │ ${features} │`);
  }

  console.log("└─────────────────────────────────────────────┴────────────┴──────────────────────────────────┘");

  // AI Overview opportunities
  const aiOverviewKeywords = results.filter((r) =>
    r.features.includes("ai_overview")
  );
  if (aiOverviewKeywords.length > 0) {
    console.log(`\n✦ AI Overview detected for ${aiOverviewKeywords.length}/${results.length} keywords (high GEO opportunity):`);
    for (const r of aiOverviewKeywords) {
      console.log(`  • ${r.keyword}`);
      if (r.aiOverview?.sources?.length) {
        console.log(`    Cited sources: ${r.aiOverview.sources.map((s) => s.domain).join(", ")}`);
      }
    }
  }

  // Featured Snippet opportunities
  const snippetKeywords = results.filter((r) =>
    r.features.includes("featured_snippet")
  );
  if (snippetKeywords.length > 0) {
    console.log(`\n✦ Featured Snippet detected for ${snippetKeywords.length} keywords:`);
    for (const r of snippetKeywords) {
      console.log(`  • ${r.keyword} — currently held by: ${r.featuredSnippet?.domain || "unknown"}`);
    }
  }

  // Easy wins (low difficulty)
  const easyWins = results.filter(
    (r) => r.difficulty === "easy" || r.difficulty === "easy-medium"
  );
  if (easyWins.length > 0) {
    console.log(`\n✦ Easy wins (${easyWins.length} keywords with low competition):`);
    for (const r of easyWins) {
      console.log(`  • ${r.keyword} [${r.difficulty}]`);
    }
  }

  // Tracked domain presence
  if (trackedDomains.length > 0) {
    console.log(`\n✦ Tracked domains presence:`);
    for (const domain of trackedDomains) {
      const present = results.filter((r) =>
        r.domains.some((d) => d.includes(domain))
      );
      const absent = results.filter(
        (r) => !r.domains.some((d) => d.includes(domain))
      );
      console.log(`\n  ${domain}:`);
      console.log(`    Ranking for: ${present.length}/${results.length} keywords`);
      if (present.length > 0) {
        for (const r of present) {
          const pos = r.organicResults.find((o) => o.domain.includes(domain));
          console.log(`      ✓ "${r.keyword}" — position ${pos?.position || "?"}`);
        }
      }
      if (absent.length > 0) {
        console.log(`    Missing from (content gap):`);
        for (const r of absent) {
          console.log(`      ✗ "${r.keyword}"`);
        }
      }
    }
  }

  // All PAA questions (deduplicated)
  const allPAA = new Set();
  for (const r of results) {
    for (const q of r.paaQuestions) allPAA.add(q);
  }
  if (allPAA.size > 0) {
    console.log(`\n✦ All People Also Ask questions (${allPAA.size} unique):`);
    let i = 0;
    for (const q of allPAA) {
      if (i++ >= 30) {
        console.log(`  ... and ${allPAA.size - 30} more`);
        break;
      }
      console.log(`  ? ${q}`);
    }
  }

  // Domain frequency across all SERPs
  const domainFreq = {};
  for (const r of results) {
    for (const d of r.domains) {
      domainFreq[d] = (domainFreq[d] || 0) + 1;
    }
  }
  const topDomains = Object.entries(domainFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  console.log(`\n✦ Most frequent ranking domains (top competitors):`);
  for (const [domain, count] of topDomains) {
    const bar = "█".repeat(count);
    console.log(`  ${domain.padEnd(35)} ${bar} (${count})`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function main() {
  const opts = parseArgs();

  let keywords = opts.keywords;

  // Load from input file if provided
  if (opts.input) {
    const data = JSON.parse(fs.readFileSync(opts.input, "utf-8"));
    const kws = data.keywords || [];
    keywords = kws.slice(0, opts.top).map((k) =>
      typeof k === "string" ? k : k.keyword
    );
    console.log(
      `Loaded ${kws.length} keywords from ${opts.input}, analyzing top ${opts.top}`
    );
  }

  console.log(`\nAnalyzing ${keywords.length} keywords...\n`);

  const results = [];

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    console.log(
      `[${i + 1}/${keywords.length}] Analyzing: "${keyword}"`
    );

    try {
      const analysis = await analyzeSERP(keyword, opts.gl, opts.hl, opts.provider);
      results.push(analysis);
      console.log(
        `  → ${analysis.features.length} features, ${analysis.organicResults.length} organic, difficulty: ${analysis.difficulty}`
      );
    } catch (e) {
      console.log(`  → Error: ${e.message}`);
    }

    if (i < keywords.length - 1) await sleep(1500);
  }

  printReport(results, opts.track);

  // Save results
  const outPath = opts.out || `serp-analysis-${Date.now()}.json`;
  const output = {
    meta: {
      generated: new Date().toISOString(),
      provider: opts.provider,
      keywordsAnalyzed: results.length,
      trackedDomains: opts.track,
    },
    results,
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Full results saved to: ${outPath}`);
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
