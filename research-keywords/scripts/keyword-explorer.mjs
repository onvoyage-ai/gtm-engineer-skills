#!/usr/bin/env node

/**
 * Keyword Explorer — SERP-powered keyword research tool
 *
 * Uses SerpAPI (with free tier) to pull real Google data:
 * - Autocomplete suggestions
 * - People Also Ask questions
 * - Related Searches
 * - SERP features detection (AI Overviews, Featured Snippets)
 *
 * Also supports a free fallback mode using Google's suggestions endpoint
 * (no API key needed, but limited to autocomplete only).
 *
 * Usage:
 *   # With SerpAPI key (full features)
 *   SERPAPI_KEY=xxx node keyword-explorer.mjs --seeds "physical AI, DePAI, decentralized robotics"
 *
 *   # Free mode (autocomplete only, no API key)
 *   node keyword-explorer.mjs --seeds "physical AI, DePAI" --free
 *
 *   # With output file
 *   SERPAPI_KEY=xxx node keyword-explorer.mjs --seeds "physical AI" --out keywords.json
 *
 *   # With specific country/language
 *   SERPAPI_KEY=xxx node keyword-explorer.mjs --seeds "physical AI" --gl us --hl en
 */

import https from "https";
import fs from "fs";
import { URL, URLSearchParams } from "url";

// ─── Config ───────────────────────────────────────────────────────────────────

const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
const AUTOCOMPLETE_SUFFIXES = [
  "",
  " for",
  " vs",
  " best",
  " how to",
  " without",
  " free",
  " alternative",
  " comparison",
  " review",
  " is",
  " can",
  " why",
];

// ─── CLI Args ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    seeds: [],
    free: false,
    out: null,
    gl: "us",
    hl: "en",
    depth: "normal", // "quick" | "normal" | "deep"
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--seeds":
      case "-s":
        opts.seeds = args[++i].split(",").map((s) => s.trim());
        break;
      case "--free":
        opts.free = true;
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
      case "--depth":
      case "-d":
        opts.depth = args[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  if (opts.seeds.length === 0) {
    console.error("Error: --seeds is required. Use --help for usage.");
    process.exit(1);
  }

  if (!opts.free && !SERPAPI_KEY) {
    process.stderr.write(
      "No SERPAPI_KEY found. Falling back to free mode (autocomplete only).\n" +
      "Set SERPAPI_KEY env var for full features (PAA, Related Searches, SERP features).\n\n"
    );
    opts.free = true;
  }

  return opts;
}

function printHelp() {
  console.log(`
Keyword Explorer — SERP-powered keyword research

Usage:
  SERPAPI_KEY=xxx node keyword-explorer.mjs --seeds "keyword1, keyword2"

Options:
  --seeds, -s   Comma-separated seed keywords (required)
  --free        Use free Google suggestions (no API key, autocomplete only)
  --out, -o     Output file path (default: stdout as JSON)
  --gl          Country code (default: us)
  --hl          Language code (default: en)
  --depth, -d   Research depth: quick | normal | deep (default: normal)
  --help, -h    Show this help

Environment:
  SERPAPI_KEY    Your SerpAPI key (free tier: serpapi.com, 100 searches/month)

Examples:
  # Full research with SerpAPI
  SERPAPI_KEY=xxx node keyword-explorer.mjs -s "physical AI, DePAI"

  # Quick autocomplete-only scan (no key needed)
  node keyword-explorer.mjs -s "physical AI" --free

  # Deep research with output file
  SERPAPI_KEY=xxx node keyword-explorer.mjs -s "physical AI" -d deep -o results.json
  `);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: { "User-Agent": "KeywordExplorer/1.0" },
    };

    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Failed to parse JSON from ${url}: ${data.slice(0, 200)}`));
          }
        });
      })
      .on("error", reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    };

    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Free Mode: Google Suggestions ───────────────────────────────────────────

async function googleSuggest(query, gl = "us", hl = "en") {
  const params = new URLSearchParams({
    q: query,
    client: "firefox",
    gl,
    hl,
  });
  const url = `https://www.google.com/complete/search?${params}`;

  try {
    const text = await fetchText(url);
    const parsed = JSON.parse(text);
    // Response format: [query, [suggestions]]
    return (parsed[1] || []).map((s) =>
      typeof s === "string" ? s : String(s)
    );
  } catch {
    return [];
  }
}

async function runFreeAutocomplete(seeds, gl, hl, depth) {
  const suffixes =
    depth === "quick"
      ? AUTOCOMPLETE_SUFFIXES.slice(0, 5)
      : depth === "deep"
        ? AUTOCOMPLETE_SUFFIXES
        : AUTOCOMPLETE_SUFFIXES.slice(0, 9);

  const allSuggestions = new Map(); // keyword -> { source, seed }

  for (const seed of seeds) {
    log(`\n🔍 Autocomplete: "${seed}"`);

    for (const suffix of suffixes) {
      const query = seed + suffix;
      const suggestions = await googleSuggest(query, gl, hl);

      for (const s of suggestions) {
        if (!allSuggestions.has(s.toLowerCase())) {
          allSuggestions.set(s.toLowerCase(), {
            keyword: s,
            source: "autocomplete",
            query: query.trim(),
            seed,
          });
        }
      }

      log(`  "${query.trim()}" → ${suggestions.length} suggestions`);
      await sleep(300); // rate limit
    }

    // Also try alphabet expansion: "seed a", "seed b", etc.
    if (depth === "deep") {
      log(`  Running alphabet expansion for "${seed}"...`);
      for (const letter of "abcdefghijklmnopqrstuvwxyz") {
        const query = `${seed} ${letter}`;
        const suggestions = await googleSuggest(query, gl, hl);
        for (const s of suggestions) {
          if (!allSuggestions.has(s.toLowerCase())) {
            allSuggestions.set(s.toLowerCase(), {
              keyword: s,
              source: "autocomplete-alpha",
              query,
              seed,
            });
          }
        }
        await sleep(200);
      }
    }
  }

  return [...allSuggestions.values()];
}

// ─── SerpAPI Mode ─────────────────────────────────────────────────────────────

async function serpApiSearch(params) {
  const allParams = new URLSearchParams({
    api_key: SERPAPI_KEY,
    ...params,
  });
  const url = `https://serpapi.com/search.json?${allParams}`;
  return fetchJSON(url);
}

async function serpAutocomplete(query, gl, hl) {
  const data = await serpApiSearch({
    engine: "google_autocomplete",
    q: query,
    gl,
    hl,
  });
  return (data.suggestions || []).map((s) => s.value);
}

async function serpGoogleSearch(query, gl, hl) {
  const data = await serpApiSearch({
    engine: "google",
    q: query,
    gl,
    hl,
    num: 10,
  });

  const result = {
    paa: [],
    relatedSearches: [],
    serpFeatures: [],
  };

  // People Also Ask
  if (data.related_questions) {
    result.paa = data.related_questions.map((q) => ({
      question: q.question,
      snippet: q.snippet || "",
      source: q.source?.name || "",
      link: q.link || "",
    }));
  }

  // Related Searches
  if (data.related_searches) {
    result.relatedSearches = data.related_searches.map((r) => r.query);
  }

  // Detect SERP features
  if (data.ai_overview) result.serpFeatures.push("ai_overview");
  if (data.answer_box) result.serpFeatures.push("featured_snippet");
  if (data.knowledge_graph) result.serpFeatures.push("knowledge_graph");
  if (data.related_questions?.length > 0) result.serpFeatures.push("people_also_ask");
  if (data.top_stories) result.serpFeatures.push("top_stories");
  if (data.video_results) result.serpFeatures.push("video_results");
  if (data.shopping_results) result.serpFeatures.push("shopping");
  if (data.local_results) result.serpFeatures.push("local_pack");

  return result;
}

async function runSerpApiResearch(seeds, gl, hl, depth) {
  const keywords = new Map();
  const paaQuestions = [];
  const serpFeaturesByQuery = {};
  const relatedSearches = new Map();

  // Step 1: Autocomplete for all seeds
  log("\n━━━ Step 1: Autocomplete Mining ━━━");

  const suffixes =
    depth === "quick"
      ? AUTOCOMPLETE_SUFFIXES.slice(0, 5)
      : depth === "deep"
        ? AUTOCOMPLETE_SUFFIXES
        : AUTOCOMPLETE_SUFFIXES.slice(0, 9);

  for (const seed of seeds) {
    log(`\n🔍 "${seed}"`);
    for (const suffix of suffixes) {
      const query = seed + suffix;
      try {
        const suggestions = await serpAutocomplete(query, gl, hl);
        for (const s of suggestions) {
          if (!keywords.has(s.toLowerCase())) {
            keywords.set(s.toLowerCase(), {
              keyword: s,
              source: "autocomplete",
              seed,
            });
          }
        }
        log(`  "${query.trim()}" → ${suggestions.length} suggestions`);
      } catch (e) {
        log(`  "${query.trim()}" → error: ${e.message}`);
      }
      await sleep(500);
    }
  }

  // Step 2: Google Search for PAA, Related Searches, SERP features
  log("\n━━━ Step 2: SERP Analysis (PAA + Related + Features) ━━━");

  const searchQueries = [];
  for (const seed of seeds) {
    searchQueries.push(seed);
    searchQueries.push(`best ${seed}`);
    searchQueries.push(`what is ${seed}`);
    if (depth === "deep") {
      searchQueries.push(`${seed} vs`);
      searchQueries.push(`how does ${seed} work`);
      searchQueries.push(`${seed} comparison 2026`);
      searchQueries.push(`is ${seed} worth it`);
    } else if (depth === "normal") {
      searchQueries.push(`${seed} vs`);
      searchQueries.push(`how does ${seed} work`);
    }
  }

  for (const query of searchQueries) {
    log(`\n🔎 SERP: "${query}"`);
    try {
      const result = await serpGoogleSearch(query, gl, hl);

      // PAA
      if (result.paa.length > 0) {
        log(`  PAA: ${result.paa.length} questions`);
        for (const q of result.paa) {
          paaQuestions.push({ ...q, fromQuery: query });
          if (!keywords.has(q.question.toLowerCase())) {
            keywords.set(q.question.toLowerCase(), {
              keyword: q.question,
              source: "people_also_ask",
              seed: query,
            });
          }
        }
      }

      // Related Searches
      if (result.relatedSearches.length > 0) {
        log(`  Related: ${result.relatedSearches.length} queries`);
        for (const rs of result.relatedSearches) {
          if (!relatedSearches.has(rs.toLowerCase())) {
            relatedSearches.set(rs.toLowerCase(), { query: rs, fromQuery: query });
          }
          if (!keywords.has(rs.toLowerCase())) {
            keywords.set(rs.toLowerCase(), {
              keyword: rs,
              source: "related_search",
              seed: query,
            });
          }
        }
      }

      // SERP Features
      if (result.serpFeatures.length > 0) {
        log(`  Features: ${result.serpFeatures.join(", ")}`);
        serpFeaturesByQuery[query] = result.serpFeatures;
      }
    } catch (e) {
      log(`  Error: ${e.message}`);
    }
    await sleep(1000);
  }

  return {
    keywords: [...keywords.values()],
    paaQuestions,
    relatedSearches: [...relatedSearches.values()],
    serpFeatures: serpFeaturesByQuery,
  };
}

// ─── Output Formatting ───────────────────────────────────────────────────────

function formatOutput(data, mode) {
  const output = {
    meta: {
      generated: new Date().toISOString(),
      mode,
      totalKeywords: data.keywords?.length || data.length,
    },
  };

  if (mode === "free") {
    output.keywords = data;
    output.meta.note =
      "Free mode: autocomplete only. Set SERPAPI_KEY for PAA, Related Searches, and SERP feature detection.";
  } else {
    output.keywords = data.keywords;
    output.peopleAlsoAsk = data.paaQuestions;
    output.relatedSearches = data.relatedSearches;
    output.serpFeatures = data.serpFeatures;
    output.meta.paaCount = data.paaQuestions.length;
    output.meta.relatedSearchCount = data.relatedSearches.length;
    output.meta.queriesWithAIOverview = Object.entries(data.serpFeatures)
      .filter(([, features]) => features.includes("ai_overview"))
      .map(([query]) => query);
  }

  return output;
}

function log(msg) {
  process.stderr.write(msg + "\n");
}

function printSummary(output, mode) {
  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("  KEYWORD EXPLORER — RESULTS SUMMARY");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  log(`  Mode: ${mode === "free" ? "Free (autocomplete)" : "SerpAPI (full)"}`);
  log(`  Total Keywords: ${output.meta.totalKeywords}`);

  if (mode !== "free") {
    log(`  People Also Ask: ${output.meta.paaCount} questions`);
    log(`  Related Searches: ${output.meta.relatedSearchCount}`);

    if (output.meta.queriesWithAIOverview.length > 0) {
      log(`\n  Queries with AI Overview (high GEO opportunity):`);
      for (const q of output.meta.queriesWithAIOverview) {
        log(`    ✦ ${q}`);
      }
    }

    // Top PAA questions
    if (output.peopleAlsoAsk.length > 0) {
      log(`\n  Top People Also Ask questions:`);
      const seen = new Set();
      let count = 0;
      for (const q of output.peopleAlsoAsk) {
        if (!seen.has(q.question) && count < 15) {
          log(`    ? ${q.question}`);
          seen.add(q.question);
          count++;
        }
      }
    }
  }

  // Keyword sources breakdown
  const sources = {};
  const kws = output.keywords || [];
  for (const k of kws) {
    sources[k.source] = (sources[k.source] || 0) + 1;
  }
  log(`\n  Keywords by source:`);
  for (const [src, count] of Object.entries(sources).sort((a, b) => b[1] - a[1])) {
    log(`    ${src}: ${count}`);
  }

  // Sample keywords
  log(`\n  Sample keywords (first 20):`);
  for (const k of kws.slice(0, 20)) {
    log(`    - ${k.keyword} [${k.source}]`);
  }

  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  log("╔══════════════════════════════════════════════════╗");
  log("║         KEYWORD EXPLORER v1.0                   ║");
  log("║  SERP-powered keyword research for SEO & GEO    ║");
  log("╚══════════════════════════════════════════════════╝");
  log(`\nSeeds: ${opts.seeds.join(", ")}`);
  log(`Depth: ${opts.depth}`);
  log(`Region: ${opts.gl}/${opts.hl}`);
  log(`Mode: ${opts.free ? "Free (autocomplete)" : "SerpAPI (full)"}`);

  let rawData;
  const mode = opts.free ? "free" : "serpapi";

  if (opts.free) {
    rawData = await runFreeAutocomplete(opts.seeds, opts.gl, opts.hl, opts.depth);
  } else {
    rawData = await runSerpApiResearch(opts.seeds, opts.gl, opts.hl, opts.depth);
  }

  const output = formatOutput(rawData, mode);
  printSummary(output, mode);

  if (opts.out) {
    fs.writeFileSync(opts.out, JSON.stringify(output, null, 2));
    process.stderr.write(`Results saved to: ${opts.out}\n`);
  } else {
    process.stdout.write(JSON.stringify(output, null, 2) + "\n");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
