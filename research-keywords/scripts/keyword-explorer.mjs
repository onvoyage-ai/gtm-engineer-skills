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
 * Third provider: GoAnyAPI (https://goanyapi.com). With `--provider goanyapi`
 * the SERP analysis step runs on the GoAnyAPI SERP Stable edition
 * (GET /api/v1/serp-stable, 1 credit per request) and autocomplete still uses
 * Google's free suggestions endpoint, so credits are only spent on SERP calls.
 *
 * Usage:
 *   # With SerpAPI key (full features)
 *   SERPAPI_KEY=xxx node keyword-explorer.mjs --seeds "physical AI, DePAI, decentralized robotics"
 *
 *   # Free mode (autocomplete only, no API key)
 *   node keyword-explorer.mjs --seeds "physical AI, DePAI" --free
 *
 *   # With GoAnyAPI as the SERP provider
 *   GOANYAPI_API_KEY=xxx node keyword-explorer.mjs --seeds "physical AI" --provider goanyapi
 *
 *   # With output file
 *   SERPAPI_KEY=xxx node keyword-explorer.mjs --seeds "physical AI" --out keywords.json
 *
 *   # With specific country/language
 *   SERPAPI_KEY=xxx node keyword-explorer.mjs --seeds "physical AI" --gl us --hl en
 */

import https from "https";
import http from "http";
import fs from "fs";
import { URL, URLSearchParams } from "url";

// ─── Config ───────────────────────────────────────────────────────────────────

const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
const GOANYAPI_API_KEY = process.env.GOANYAPI_API_KEY || "";
// Overridable for testing/proxying; must point at a GoAnyAPI-compatible host.
const GOANYAPI_BASE_URL = process.env.GOANYAPI_BASE_URL || "https://api.goanyapi.com";
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
    provider: "serpapi", // "serpapi" | "goanyapi"
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

  if (opts.seeds.length === 0) {
    console.error("Error: --seeds is required. Use --help for usage.");
    process.exit(1);
  }

  if (opts.provider !== "serpapi" && opts.provider !== "goanyapi") {
    console.error(`Error: unknown provider "${opts.provider}". Use "serpapi" or "goanyapi".`);
    process.exit(1);
  }

  if (!opts.free && opts.provider === "serpapi" && !SERPAPI_KEY) {
    console.log(
      "No SERPAPI_KEY found. Falling back to free mode (autocomplete only)."
    );
    console.log(
      "Set SERPAPI_KEY env var for full features (PAA, Related Searches, SERP features).\n"
    );
    opts.free = true;
  }

  if (opts.provider === "goanyapi" && !GOANYAPI_API_KEY) {
    console.error(
      "Error: --provider goanyapi requires the GOANYAPI_API_KEY environment variable."
    );
    console.error("Get a key at https://goanyapi.com (SERP Stable: 1 credit per request).");
    process.exit(1);
  }

  return opts;
}

function printHelp() {
  console.log(`
Keyword Explorer — SERP-powered keyword research

Usage:
  SERPAPI_KEY=xxx node keyword-explorer.mjs --seeds "keyword1, keyword2"

Options:
  --seeds, -s     Comma-separated seed keywords (required)
  --free          Use free Google suggestions (no API key, autocomplete only)
  --provider, -p  SERP provider: serpapi (default) or goanyapi
  --out, -o       Output file path (default: stdout as JSON)
  --gl            Country code (default: us)
  --hl            Language code (default: en)
  --depth, -d     Research depth: quick | normal | deep (default: normal)
  --help, -h      Show this help

Environment:
  SERPAPI_KEY      Your SerpAPI key (free tier: serpapi.com, 100 searches/month)
  GOANYAPI_API_KEY Your GoAnyAPI key (goanyapi.com; SERP Stable: 1 credit/request)
  GOANYAPI_BASE_URL Optional. Override the GoAnyAPI API base URL (for testing)

Examples:
  # Full research with SerpAPI
  SERPAPI_KEY=xxx node keyword-explorer.mjs -s "physical AI, DePAI"

  # Full research with GoAnyAPI (SERP Stable, 1 credit per SERP call)
  GOANYAPI_API_KEY=xxx node keyword-explorer.mjs -s "physical AI" --provider goanyapi

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
    console.log(`\n🔍 Autocomplete: "${seed}"`);

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

      console.log(
        `  "${query.trim()}" → ${suggestions.length} suggestions`
      );
      await sleep(300); // rate limit
    }

    // Also try alphabet expansion: "seed a", "seed b", etc.
    if (depth === "deep") {
      console.log(`  Running alphabet expansion for "${seed}"...`);
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
  console.log("\n━━━ Step 1: Autocomplete Mining ━━━");

  const suffixes =
    depth === "quick"
      ? AUTOCOMPLETE_SUFFIXES.slice(0, 5)
      : depth === "deep"
        ? AUTOCOMPLETE_SUFFIXES
        : AUTOCOMPLETE_SUFFIXES.slice(0, 9);

  for (const seed of seeds) {
    console.log(`\n🔍 "${seed}"`);
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
        console.log(`  "${query.trim()}" → ${suggestions.length} suggestions`);
      } catch (e) {
        console.log(`  "${query.trim()}" → error: ${e.message}`);
      }
      await sleep(500);
    }
  }

  // Step 2: Google Search for PAA, Related Searches, SERP features
  console.log("\n━━━ Step 2: SERP Analysis (PAA + Related + Features) ━━━");

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
    console.log(`\n🔎 SERP: "${query}"`);
    try {
      const result = await serpGoogleSearch(query, gl, hl);

      // PAA
      if (result.paa.length > 0) {
        console.log(`  PAA: ${result.paa.length} questions`);
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
        console.log(`  Related: ${result.relatedSearches.length} queries`);
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
        console.log(`  Features: ${result.serpFeatures.join(", ")}`);
        serpFeaturesByQuery[query] = result.serpFeatures;
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
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

// ─── GoAnyAPI Mode (SERP Stable) ─────────────────────────────────────────────

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
            "User-Agent": "KeywordExplorer/1.0",
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

// Map GoAnyAPI serp_features `type` values onto the SerpAPI-style feature names
// this script uses downstream. Unknown types are kept as-is so new modules
// still surface in the output instead of being dropped.
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

async function goanyapiSerpSearch(query, gl, hl) {
  // SERP Stable edition: `query` (not `q`), 1 credit per successful request.
  const payload = await goanyapiGet("/api/v1/serp-stable", { query, gl, hl });
  if (payload.code && payload.code !== "ok") {
    throw new Error(
      `GoAnyAPI serp-stable error: ${payload.message || payload.code}`
    );
  }
  return payload?.data?.result || {};
}

async function runGoAnyApiResearch(seeds, gl, hl, depth) {
  const keywords = new Map();
  const paaQuestions = [];
  const serpFeaturesByQuery = {};
  const relatedSearches = new Map();

  // Step 1: autocomplete via Google's free suggestions endpoint (zero cost).
  console.log("\n━━━ Step 1: Autocomplete Mining (free Google suggestions) ━━━");
  const suggestions = await runFreeAutocomplete(seeds, gl, hl, depth);
  for (const s of suggestions) {
    keywords.set(s.keyword.toLowerCase(), s);
  }

  // Step 2: SERP analysis via GoAnyAPI SERP Stable (1 credit per request).
  console.log("\n━━━ Step 2: SERP Analysis via GoAnyAPI (PAA + Related + Features) ━━━");

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
    console.log(`\n🔎 SERP: "${query}"`);
    try {
      const result = await goanyapiSerpSearch(query, gl, hl);
      const features = Array.isArray(result.serp_features)
        ? result.serp_features
        : [];
      const featureNames = new Set();

      for (const feature of features) {
        const mapped = mapGoAnyApiFeatureType(feature.type);
        if (mapped) featureNames.add(mapped);

        const items = Array.isArray(feature.items) ? feature.items : [];

        if (mapped === "people_also_ask") {
          const questions = items
            .map((it) => it.title || it.text || "")
            .filter(Boolean);
          console.log(`  PAA: ${questions.length} questions`);
          for (const question of questions) {
            paaQuestions.push({ question, snippet: "", source: "", link: "", fromQuery: query });
            if (!keywords.has(question.toLowerCase())) {
              keywords.set(question.toLowerCase(), {
                keyword: question,
                source: "people_also_ask",
                seed: query,
              });
            }
          }
        }

        if (mapped === "related_search") {
          const queries = items
            .map((it) => it.title || it.text || "")
            .filter(Boolean);
          console.log(`  Related: ${queries.length} queries`);
          for (const rs of queries) {
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
      }

      if (featureNames.size > 0) {
        console.log(`  Features: ${[...featureNames].join(", ")}`);
        serpFeaturesByQuery[query] = [...featureNames];
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
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

function printSummary(output, mode) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  KEYWORD EXPLORER — RESULTS SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`  Mode: ${mode === "free" ? "Free (autocomplete)" : mode === "goanyapi" ? "GoAnyAPI SERP Stable (full)" : "SerpAPI (full)"}`);
  console.log(`  Total Keywords: ${output.meta.totalKeywords}`);

  if (mode !== "free") {
    console.log(`  People Also Ask: ${output.meta.paaCount} questions`);
    console.log(`  Related Searches: ${output.meta.relatedSearchCount}`);

    if (output.meta.queriesWithAIOverview.length > 0) {
      console.log(`\n  Queries with AI Overview (high GEO opportunity):`);
      for (const q of output.meta.queriesWithAIOverview) {
        console.log(`    ✦ ${q}`);
      }
    }

    // Top PAA questions
    if (output.peopleAlsoAsk.length > 0) {
      console.log(`\n  Top People Also Ask questions:`);
      const seen = new Set();
      let count = 0;
      for (const q of output.peopleAlsoAsk) {
        if (!seen.has(q.question) && count < 15) {
          console.log(`    ? ${q.question}`);
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
  console.log(`\n  Keywords by source:`);
  for (const [src, count] of Object.entries(sources).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${src}: ${count}`);
  }

  // Sample keywords
  console.log(`\n  Sample keywords (first 20):`);
  for (const k of kws.slice(0, 20)) {
    console.log(`    - ${k.keyword} [${k.source}]`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║         KEYWORD EXPLORER v1.0                   ║");
  console.log("║  SERP-powered keyword research for SEO & GEO    ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nSeeds: ${opts.seeds.join(", ")}`);
  console.log(`Depth: ${opts.depth}`);
  console.log(`Region: ${opts.gl}/${opts.hl}`);
  console.log(`Mode: ${opts.provider === "goanyapi" ? "GoAnyAPI SERP Stable (full)" : opts.free ? "Free (autocomplete)" : "SerpAPI (full)"}`);

  let rawData;
  let mode;
  if (opts.provider === "goanyapi") {
    mode = "goanyapi";
    rawData = await runGoAnyApiResearch(opts.seeds, opts.gl, opts.hl, opts.depth);
  } else {
    mode = opts.free ? "free" : "serpapi";
    if (opts.free) {
      rawData = await runFreeAutocomplete(opts.seeds, opts.gl, opts.hl, opts.depth);
    } else {
      rawData = await runSerpApiResearch(opts.seeds, opts.gl, opts.hl, opts.depth);
    }
  }

  const output = formatOutput(rawData, mode);
  printSummary(output, mode);

  if (opts.out) {
    fs.writeFileSync(opts.out, JSON.stringify(output, null, 2));
    console.log(`Results saved to: ${opts.out}`);
  } else {
    // Also save to a default location
    const defaultOut = `keyword-explorer-${Date.now()}.json`;
    fs.writeFileSync(defaultOut, JSON.stringify(output, null, 2));
    console.log(`Results saved to: ${defaultOut}`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
