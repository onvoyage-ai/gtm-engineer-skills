import { readFileSync } from "node:fs";

const KEYWORD_HEADER = [
  "keyword",
  "volume",
  "kd",
  "intent",
  "priority",
  "cluster",
  "is_pillar",
  "ai_overview_present",
  "source",
  "notes",
];

const PROMPT_HEADER = [
  "prompt",
  "tier",
  "citability",
  "competition",
  "priority",
  "query_type",
  "cluster",
  "target_engines",
  "brand_mention_mechanism",
  "notes",
];

const PLAN_HEADER = [
  "page_id",
  "priority",
  "page_type",
  "section",
  "subsection",
  "title",
  "url_slug",
  "target_keywords",
  "target_prompts",
  "required_sections",
  "why_it_matters",
];

const INTENTS = new Set(["informational", "commercial", "research", "transactional"]);
const KEYWORD_PRIORITIES = new Set(["easy_win", "target", "content", "hard"]);
const SOURCES = new Set(["ahrefs", "semrush", "serpapi", "autocomplete", "paa", "reddit", "competitor", "manual"]);
const BOOLEAN_OR_EMPTY = new Set(["", "true", "false"]);
const TIERS = new Set(["buy", "solve", "learn"]);
const CITABILITY = new Set(["high", "medium", "low"]);
const COMPETITION = new Set(["none", "low", "medium", "hard"]);
const PROMPT_PRIORITIES = new Set(["easy_win", "target", "skip"]);
const QUERY_TYPES = new Set(["definition", "recommendation", "comparison", "evaluation", "how_to", "cost", "landscape", "use_case"]);
const TARGET_ENGINES = new Set(["chatgpt", "perplexity", "claude", "gemini", "ai_overview"]);
const PAGE_PRIORITIES = new Set(["p1", "p2", "p3"]);
const PAGE_TYPES = new Set(["money", "comparison", "use_case", "trust", "definition"]);
const SECTIONS = new Set(["product", "use_cases", "resources"]);
const SUBSECTIONS = new Set(["guides", "comparisons", "learn", "blog"]);
const REQUIRED_SECTIONS = new Set(["direct_answer", "comparison_table", "who_this_is_for", "how_it_works", "use_cases", "faqs", "proof", "objections"]);

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(value);
      value = "";
      continue;
    }
    if (ch === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }
    if (ch === "\r") continue;
    value += ch;
  }

  if (inQuotes) {
    throw new Error("Unterminated quoted field");
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

export function validateKeywordsCsv(text) {
  const errors = [];
  const rows = parseWithHeader(text, KEYWORD_HEADER, errors);
  if (rows.length === 0) return result(errors);

  const seenKeywords = new Set();
  const pillarByCluster = new Map();

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    assertFieldCount(row, 10, line, errors);
    if (row.length !== 10) continue;

    const [keyword, volume, kd, intent, priority, cluster, isPillar, aiOverviewPresent, source] = row;
    if (keyword !== keyword.trim() || keyword !== keyword.toLowerCase()) {
      errors.push(`line ${line}: keyword must be lowercase with no surrounding whitespace`);
    }
    if (!between(wordCount(keyword), 1, 3)) {
      errors.push(`line ${line}: keyword must be 1-3 words`);
    }
    const normalizedKeyword = keyword.toLowerCase();
    if (seenKeywords.has(normalizedKeyword)) {
      errors.push(`line ${line}: duplicate keyword "${keyword}"`);
    }
    seenKeywords.add(normalizedKeyword);

    validateOptionalInteger(volume, line, "volume", errors);
    validateOptionalInteger(kd, line, "kd", errors, 0, 100);
    validateEnum(intent, INTENTS, line, "intent", errors);
    validateEnum(priority, KEYWORD_PRIORITIES, line, "priority", errors);
    if (!cluster.trim()) {
      errors.push(`line ${line}: cluster must be non-empty`);
    }
    validateEnum(isPillar, new Set(["true", "false"]), line, "is_pillar", errors);
    validateEnum(aiOverviewPresent, BOOLEAN_OR_EMPTY, line, "ai_overview_present", errors);
    validateEnum(source, SOURCES, line, "source", errors);

    if (volume === "0") {
      errors.push(`line ${line}: keywords with volume=0 must be removed`);
    }

    const existing = pillarByCluster.get(cluster) ?? false;
    pillarByCluster.set(cluster, existing || isPillar === "true");
  }

  if (rows.length < 10) {
    errors.push("expected at least 10 data rows");
  }
  for (const [cluster, hasPillar] of pillarByCluster.entries()) {
    if (!hasPillar) errors.push(`cluster "${cluster}" is missing an is_pillar=true row`);
  }

  return result(errors);
}

export function validatePromptsCsv(text) {
  const errors = [];
  const rows = parseWithHeader(text, PROMPT_HEADER, errors);
  if (rows.length === 0) return result(errors);

  const seenPrompts = new Set();

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    assertFieldCount(row, 10, line, errors);
    if (row.length !== 10) continue;

    const [prompt, tier, citability, competition, priority, queryType, cluster, targetEngines, brandMentionMechanism] = row;
    if (wordCount(prompt) < 5) {
      errors.push(`line ${line}: prompt must contain at least 5 words`);
    }
    const normalizedPrompt = prompt.trim().toLowerCase();
    if (seenPrompts.has(normalizedPrompt)) {
      errors.push(`line ${line}: duplicate prompt "${prompt}"`);
    }
    seenPrompts.add(normalizedPrompt);

    validateEnum(tier, TIERS, line, "tier", errors);
    validateEnum(citability, CITABILITY, line, "citability", errors);
    validateEnum(competition, COMPETITION, line, "competition", errors);
    validateEnum(priority, PROMPT_PRIORITIES, line, "priority", errors);
    validateEnum(queryType, QUERY_TYPES, line, "query_type", errors);
    if (!cluster.trim()) {
      errors.push(`line ${line}: cluster must be non-empty`);
    }
    validatePipeSet(targetEngines, TARGET_ENGINES, line, "target_engines", errors);
    if (!brandMentionMechanism.trim()) {
      errors.push(`line ${line}: brand_mention_mechanism must be non-empty`);
    }
    if (brandMentionMechanism.trim().toLowerCase() === "builds awareness") {
      errors.push(`line ${line}: brand_mention_mechanism is too vague`);
    }
  }

  if (rows.length < 20) {
    errors.push("expected at least 20 data rows");
  }

  return result(errors);
}

export function validatePlanCsv(text, references = {}) {
  const errors = [];
  const warnings = [];
  const rows = parseWithHeader(text, PLAN_HEADER, errors);
  if (rows.length === 0) return result(errors, warnings);

  const keywordSet = references.keywordsText ? buildKeywordSet(references.keywordsText) : null;
  const promptSet = references.promptsText ? buildPromptSet(references.promptsText) : null;
  if (!keywordSet) warnings.push("keywords.csv not provided; skipped keyword cross-reference validation");
  if (!promptSet) warnings.push("prompts.csv not provided; skipped prompt cross-reference validation");

  const pageIds = new Set();
  const urlSlugs = new Set();
  let p1Count = 0;

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    assertFieldCount(row, 11, line, errors);
    if (row.length !== 11) continue;

    const [pageId, priority, pageType, section, subsection, title, urlSlug, targetKeywords, targetPrompts, requiredSections, whyItMatters] = row;

    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(pageId)) {
      errors.push(`line ${line}: page_id must be snake_case`);
    }
    if (pageIds.has(pageId)) {
      errors.push(`line ${line}: duplicate page_id "${pageId}"`);
    }
    pageIds.add(pageId);

    validateEnum(priority, PAGE_PRIORITIES, line, "priority", errors);
    if (priority === "p1") p1Count += 1;
    validateEnum(pageType, PAGE_TYPES, line, "page_type", errors);
    validateEnum(section, SECTIONS, line, "section", errors);

    if (section === "resources") {
      validateEnum(subsection, SUBSECTIONS, line, "subsection", errors);
    } else if (subsection !== "") {
      errors.push(`line ${line}: subsection must be empty unless section=resources`);
    }

    if (!title.trim()) {
      errors.push(`line ${line}: title must be non-empty`);
    }
    if (!urlSlug.startsWith("/")) {
      errors.push(`line ${line}: url_slug must start with /`);
    }
    if (urlSlugs.has(urlSlug)) {
      errors.push(`line ${line}: duplicate url_slug "${urlSlug}"`);
    }
    urlSlugs.add(urlSlug);

    validatePipeSet(requiredSections, REQUIRED_SECTIONS, line, "required_sections", errors);
    if (whyItMatters.trim().length < 15) {
      errors.push(`line ${line}: why_it_matters must be at least 15 characters`);
    }

    const keywordRefs = splitPipe(targetKeywords);
    if (keywordRefs.length === 0) {
      errors.push(`line ${line}: target_keywords must contain at least one keyword`);
    }
    const promptRefs = splitPipe(targetPrompts);
    if (promptRefs.length === 0) {
      errors.push(`line ${line}: target_prompts must contain at least one prompt`);
    }

    if (keywordSet) {
      for (const keyword of keywordRefs) {
        if (!keywordSet.has(keyword.toLowerCase())) {
          errors.push(`line ${line}: target keyword "${keyword}" not found in keywords.csv`);
        }
      }
    }
    if (promptSet) {
      for (const prompt of promptRefs) {
        if (!promptSet.has(normalizePromptRef(prompt))) {
          errors.push(`line ${line}: target prompt "${prompt}" not found in prompts.csv`);
        }
      }
    }
  }

  if (rows.length < 5) errors.push("expected at least 5 data rows");
  if (p1Count === 0) errors.push("expected at least one row with priority=p1");

  return result(errors, warnings);
}

function result(errors, warnings = []) {
  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function parseWithHeader(text, expectedHeader, errors) {
  const trimmed = text.trimEnd();
  if (trimmed.startsWith("```")) {
    errors.push("output must not be wrapped in a code fence");
    return [];
  }

  let rows;
  try {
    rows = parseCsv(trimmed);
  } catch (error) {
    errors.push(`CSV parse error: ${error.message}`);
    return [];
  }

  if (rows.length === 0) {
    errors.push("CSV is empty");
    return [];
  }

  const header = rows[0];
  if (header.length !== expectedHeader.length || header.some((value, i) => value !== expectedHeader[i])) {
    errors.push(`header mismatch: expected "${expectedHeader.join(",")}"`);
    return [];
  }

  return rows.slice(1);
}

function assertFieldCount(row, expected, line, errors) {
  if (row.length !== expected) {
    errors.push(`line ${line}: expected ${expected} fields, found ${row.length}`);
  }
}

function validateEnum(value, allowed, line, field, errors) {
  if (!allowed.has(value)) {
    errors.push(`line ${line}: ${field} must be one of ${[...allowed].join(", ")}`);
  }
}

function validateOptionalInteger(value, line, field, errors, min = 0, max = Number.POSITIVE_INFINITY) {
  if (value === "") return;
  if (!/^\d+$/.test(value)) {
    errors.push(`line ${line}: ${field} must be an integer`);
    return;
  }
  const numeric = Number.parseInt(value, 10);
  if (numeric < min || numeric > max) {
    errors.push(`line ${line}: ${field} must be between ${min} and ${max}`);
  }
}

function validatePipeSet(value, allowed, line, field, errors) {
  const values = splitPipe(value);
  if (values.length === 0) {
    errors.push(`line ${line}: ${field} must contain at least one value`);
    return;
  }
  for (const item of values) {
    if (!allowed.has(item)) {
      errors.push(`line ${line}: ${field} contains invalid value "${item}"`);
    }
  }
}

function splitPipe(value) {
  return value.split("|").map((item) => item.trim()).filter(Boolean);
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function between(value, min, max) {
  return value >= min && value <= max;
}

function buildKeywordSet(text) {
  const rows = parseCsv(text.trimEnd());
  return new Set(rows.slice(1).map((row) => row[0]?.toLowerCase()).filter(Boolean));
}

function buildPromptSet(text) {
  const rows = parseCsv(text.trimEnd());
  return new Set(rows.slice(1).map((row) => normalizePromptRef(row[0])).filter(Boolean));
}

function normalizePromptRef(value) {
  return value.trim().toLowerCase().replace(/\?/g, "");
}
