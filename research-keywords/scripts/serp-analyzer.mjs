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
 * Usage:
 *   # Analyze keywords from explorer output
 *   SERPAPI_KEY=xxx node serp-analyzer.mjs --input keyword-explorer-results.json --top 20
 *
 *   # Analyze specific keywords
 *   SERPAPI_KEY=xxx node serp-analyzer.mjs --keywords "what is DePAI, physical AI companies, best AI robotics crypto"
 *
 *   # Analyze with competitor domain tracking
 *   SERPAPI_KEY=xxx node serp-analyzer.mjs --keywords "what is DePAI" --track "axisrobotics.ai,bittensor.com"
 */

import https from "https";
import fs from "fs";
import { URLSearchParams } from "url";

const SERPAPI_KEY = process.env.SERPAPI_KEY || "";

const valueOptions = new Map([
  ["--input", "input"],
  ["-i", "input"],
  ["--keywords", "keywords"],
  ["-k", "keywords"],
  ["--top", "top"],
  ["-t", "top"],
  ["--track", "track"],
  ["--out", "out"],
  ["-o", "out"],
  ["--gl", "gl"],
  ["--hl", "hl"],
]);
const recognizedOptions = new Set([...valueOptions.keys(), "--help", "-h"]);

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
  };

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === "--help" || flag === "-h") {
      printHelp();
      process.exit(0);
    }
    const field = valueOptions.get(flag);
    if (!field) continue;
    const value = readValue(args, i);
    opts[field] = convertValue(field, value);
    i += 1;
  }

  if (!SERPAPI_KEY) {
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

function readValue(args, index) {
  const value = args[index + 1];
  if (value === undefined || recognizedOptions.has(value)) {
    console.error(`Error: Missing value for ${args[index]}. Use --help for usage.`);
    process.exit(1);
  }
  return value;
}

function convertValue(field, value) {
  if (field === "keywords") return value.split(",").map((s) => s.trim());
  if (field === "track") return value.split(",").map((s) => s.trim().toLowerCase());
  if (field === "top") return parseInt(value, 10);
  return value;
}

function printHelp() {
  console.log(`
SERP Analyzer — Check real SERP competition for keywords

Usage:
  SERPAPI_KEY=xxx node serp-analyzer.mjs --keywords "keyword1, keyword2"
  SERPAPI_KEY=xxx node serp-analyzer.mjs --input explorer-results.json --top 20

Options:
  --input, -i     Path to keyword-explorer JSON output file
  --keywords, -k  Comma-separated keywords to analyze
  --top, -t       How many keywords to analyze from input file (default: 10)
  --track         Comma-separated domains to track in results (e.g., "axisrobotics.ai,bittensor.com")
  --out, -o       Output file path (default: serp-analysis-{timestamp}.json)
  --gl            Country code (default: us)
  --hl            Language code (default: en)
  --help, -h      Show this help

Environment:
  SERPAPI_KEY      Your SerpAPI key (required, free tier: serpapi.com)
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

async function analyzeSERP(keyword, gl, hl) {
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
      const analysis = await analyzeSERP(keyword, opts.gl, opts.hl);
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
