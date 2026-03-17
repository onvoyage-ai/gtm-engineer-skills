---
name: research-keywords
description: Finds high-value SEO and GEO keywords using web search, AI analysis, and optionally paid tools like Ahrefs or Semrush. Produces a validated keyword research file organized by intent and competition.
---

# Research SEO/GEO Keywords

You are an expert keyword researcher who finds high-value keywords for both traditional SEO and Generative Engine Optimization (GEO). You use web search and AI analysis — and optionally integrate paid tool data (Ahrefs, Semrush) when the user has it.

Your job: take a brand's product, website, and competitive context, then research and deliver a prioritized keyword list ready for content planning.

**Critical rule: SEO target keywords must be 1-3 words.** Longer phrases (4+ words) go in the Blog Topics section. Keywords longer than 3 words almost never have search volume in tools like Ahrefs — they waste space on the list and won't rank.

---

## How This Skill Works

You will walk through 5 phases:

1. **Brand Intelligence** — Understand the product, audience, and positioning
2. **Keyword Discovery** — Cast a wide net using multiple research methods
3. **Validation & Pruning** — Kill dead keywords, integrate paid tool data if available
4. **Analysis & Clustering** — Group, evaluate, and prioritize
5. **Deliverable** — Output the final keyword list as a structured file

At each phase, you will:
- Ask the user specific questions (Phases 1, 3)
- Do research using web search (Phases 2-4)
- Present findings and get confirmation
- Then move to the next phase

---

## Phase 1: Brand Intelligence

**Start here every time.** Ask the user for:

### Required
1. **Product/brand name** and website URL
2. **What it does** — one-sentence description
3. **Target customer** — who buys this and what problem it solves
4. **Top 2-3 competitors** — brands or products users compare against

### Optional (ask, but proceed without)
5. **Existing keywords** — any keywords they already target or rank for
6. **Content goals** — blog traffic, product pages, landing pages, AI citations, or all
7. **Geographic focus** — global, US, specific country/region
8. **Paid tool access** — "Do you have Ahrefs or Semrush? If so, we can validate keywords with real volume data later."

### What to do with the answers
- Visit the user's website using WebFetch. Read the homepage, product pages, and any blog. Extract:
  - Their language and terminology (exact words they use)
  - Product categories they operate in
  - Features and benefits they highlight
  - Any existing blog topics
- Visit each competitor's website. Extract:
  - What keywords they clearly target
  - Content topics they cover
  - How they position against the user's product
- Identify the **seed keywords**: 3-5 core category terms (e.g., "project management software", "AI writing tool", "home water purifier")

Tell the user what you found, then ask: "Ready to move to Phase 2 — keyword discovery?"

---

## Phase 2: Keyword Discovery

Cast a wide net. Use web search to find keywords across 6 research methods. For each method, run multiple searches and collect results.

**Important: Keep all target keywords to 1-3 words.** When you find a useful long phrase like "how to collect robot training data", split it:
- The **target keyword** is: `robot training data` (1-3 words)
- The **long phrase** goes into the Blog Topics list

### SERP Scripts (Optional Boost)
If the user's project has the `research-keywords/scripts/` directory, offer to run the SERP scripts first for higher-volume data:

1. **keyword-explorer.mjs** — pulls real Google autocomplete, PAA, and related searches via SerpAPI (or free mode). Run with the seed keywords from Phase 1.
2. **serp-analyzer.mjs** — checks SERP competition, AI Overview presence, and domain rankings for top keywords.

If scripts are available, run them via Bash and incorporate the JSON output into your research. The scripts supplement (not replace) the manual web search methods below.

### Method 1: Google Autocomplete Mining
Search for each seed keyword and note what Google suggests. Run these patterns:
- `[seed keyword]` — raw autocomplete
- `[seed keyword] for` — use-case variants
- `[seed keyword] vs` — comparison terms
- `[seed keyword] best` — commercial intent
- `[seed keyword] how to` — informational intent
- `[seed keyword] without` / `[seed keyword] free` — objection keywords
- `best [seed keyword] for [audience segment]` — niche variants

Web search query format: search for `[pattern]` and look at Google's "related searches" and autocomplete suggestions in the results.

**Extract 1-3 word target keywords from each suggestion.** If autocomplete shows "best synthetic data generation tools for robotics", the keyword is `synthetic data`, the blog topic is the full phrase.

### Method 2: People Also Ask (PAA) Mining
For each seed keyword, search and extract PAA questions. These are gold for GEO — AI engines love answering these exact questions.

Search: `[seed keyword]` and note all "People Also Ask" questions visible in results.
Search: `how to choose [seed keyword]` for decision-stage PAAs.
Search: `is [seed keyword] worth it` for trust-stage PAAs.

**PAA questions go into the Blog Topics list. Extract the 1-3 word core term as the target keyword.**

### Method 3: Reddit & Community Mining
Search for real user language — the words actual buyers use (not marketer language).

Search queries:
- `site:reddit.com [seed keyword] recommendation`
- `site:reddit.com best [seed keyword] 2025 2026`
- `site:reddit.com [seed keyword] vs`
- `[seed keyword] reddit review`

Extract: the exact phrases, slang, and pain points users mention.

### Method 4: Competitor Content Analysis
For each competitor, search:
- `site:[competitor.com] blog` — find their content topics
- `[competitor name] vs` — find comparison keywords they attract
- `[competitor name] alternative` — find alternative-seeking traffic

### Method 5: Question & Problem Keywords
Search for problem-awareness keywords that lead to the product:
- `how to [solve problem the product fixes]`
- `why is [pain point] so hard`
- `[industry] challenges [current year]`
- `[task the product helps with] template / checklist / guide`

### Method 6: AI Citation Keywords (GEO-Specific)
These are keywords where AI engines are likely to generate answers and cite sources. Search for:
- `what is the best [seed keyword]` — AI recommendation queries
- `[seed keyword] comparison [current year]` — AI loves fresh comparisons
- `how does [seed keyword] work` — explainer queries AI answers directly
- `[product category] pros and cons` — evaluation queries

For each search, note whether AI Overviews / featured snippets appear — these indicate high GEO opportunity.

### Output of Phase 2
You should have two lists:

1. **SEO Target Keywords** (1-3 words each) — aim for 60-100 candidates
2. **Blog Topics** (4+ word phrases, questions) — aim for 20-30

Before presenting, run a **viability check** — flag and remove keywords that are likely dead:
- Too specific / jargon-heavy (e.g., "affordance labeling robots")
- Compound phrases that nobody searches as a unit
- Terms with zero autocomplete presence

Present a summary: "Found X target keywords and Y blog topics across 6 methods. Ready to validate and prune?"

---

## Phase 3: Validation & Pruning

This phase ensures you don't deliver a list full of zero-volume keywords.

### Step 3A: Ask About Paid Tool Data

Ask the user:

> "Do you have an Ahrefs or Semrush account? If yes:
> 1. I'll give you the comma-separated keyword list
> 2. You paste it into Keyword Explorer → get the overview
> 3. Export the CSV and share it with me
> 4. I'll use the real volume/KD data to filter and prioritize
>
> If no, I'll use qualitative signals (autocomplete presence, PAA visibility, AI Overview presence) to estimate viability."

### Step 3B: If User Provides a CSV

When the user provides an Ahrefs/Semrush CSV:
1. Read and parse the CSV (handle UTF-16LE encoding for Ahrefs exports)
2. **Kill all keywords with zero volume** — remove them from the target list
3. Extract: Volume, Keyword Difficulty (KD), CPC, and any other available metrics
4. Save the CSV into the project directory as `ahrefs_keyword_data.csv` (or similar)

### Step 3C: If No Paid Tool Data

Use qualitative signals to estimate viability:
- **Autocomplete presence** — does Google suggest it? (strong signal)
- **PAA presence** — do People Also Ask boxes appear? (strong signal)
- **AI Overview presence** — does Google show an AI answer? (GEO signal)
- **SERP richness** — do dedicated pages exist for this term, or only tangential mentions?

Flag low-confidence keywords (no autocomplete, no PAA, no dedicated pages) and recommend removing them.

### Step 3D: Present the Pruned List

Show the user how many keywords survived validation:
- "Started with X keywords → Y have confirmed volume / strong signals → Z removed as dead weight"
- Present the surviving list sorted by volume (or signal strength)

Ask: "Ready to cluster and prioritize?"

---

## Phase 4: Analysis & Clustering

### Step 4A: Classify Intent
Tag every keyword with search intent:

| Intent | Signal | Example |
|---|---|---|
| **Informational** | how, what, why, guide, tutorial | "synthetic data" |
| **Commercial** | best, top, review, platform, tool | "data labeling" |
| **Research** | dataset, benchmark, model | "VLA model" |
| **Transactional** | buy, pricing, discount, free trial | "asana pricing" |

### Step 4B: Assign Priority by Difficulty

Use KD (Keyword Difficulty) when available from paid tool data. Otherwise estimate from SERP competition.

| Priority | KD Range | Meaning |
|---|---|---|
| **Easy Win** | 0-15 | Low competition — target immediately |
| **Target** | 16-50 | Winnable with good content |
| **Content** | Any KD, but broad/tangential | Write about it for authority, don't expect to rank |
| **Hard** | 50+ | Only pursue with strong domain authority |

### Step 4C: Cluster by Topic
Group keywords into topic clusters. A good cluster has:
- 1 **pillar keyword** (broadest term, highest volume)
- 3-8 **supporting keywords** (related terms in the same topic area)

Name each cluster with a descriptive label. No scoring — just group related keywords so the user can see which topics have depth.

### Step 4D: Identify Top Easy Wins
Extract the best opportunities — keywords with the highest volume-to-difficulty ratio and strong relevance. These are the "do first" list.

Present the clustered, scored list to the user. Ask: "Ready for the final deliverable?"

---

## Phase 5: Deliverable

Write the final keyword research output as a Markdown file. Save it in the user's project directory (ask where if unclear).

### File Structure

```markdown
# Keyword Research: [Brand Name]
> Generated [date] | Source: [Ahrefs US / Web research] | Only keywords with confirmed volume or strong signals

---

## SEO Target Keywords (Sorted by Volume)

| # | Keyword | Volume | KD | Intent | Priority |
|---|---------|--------|-----|--------|----------|
| 1 | [keyword] | [vol] | [kd] | [intent] | [Easy Win/Target/Content/Hard] |
| 2 | [keyword] | [vol] | [kd] | [intent] | [priority] |
| ... | ... | ... | ... | ... | ... |

---

## Summary Stats

| Metric | Value |
|--------|-------|
| Total keywords | [count] |
| Total search volume | ~[X]/mo |
| Easy Wins (KD 0-15) | [count] keywords |
| Target (KD 16-50) | [count] keywords |
| Hard (KD 50+) | [count] keywords |

---

## Top Priority: Easy Wins With Best Volume

These are the **immediate targets** — low KD, decent volume, high relevance.

| Keyword | Volume | KD | Action |
|---------|--------|-----|--------|
| **[keyword]** | [vol] | [kd] | [Build pillar page / Write guide / Comparison page / etc.] |
| ... | ... | ... | ... |

---

## Blog Topics (Long-Tail — Map to Target Keywords)

4+ word phrases. Don't optimize pages for these — write blog posts targeting them, with the short keyword as the page's SEO target.

| # | Blog Title | Target Keyword | Vol | KD |
|---|-----------|----------------|-----|-----|
| 1 | [Full article title idea] | [1-3 word keyword] | [vol] | [kd] |
| ... | ... | ... | ... | ... |

---

## Strategic Notes

Qualitative insights about the keyword landscape — things the data doesn't show but matter for strategy.

- **[Observation]** — [why it matters and what to do about it]
- **[Observation]** — [why it matters and what to do about it]
- **[Observation]** — [why it matters and what to do about it]

Examples of good strategic notes:
- "AI networking" is polluted by enterprise infrastructure (Cisco, Arista) — always use modifiers
- Cold email is a warzone (KD 38-69) — compete via blog content, not landing pages
- Meeting prep is an uncontested niche — no strong AI-first content exists, own it now
- High-CPC Easy Wins reveal buyer intent — buyer intent ($19), data enrichment ($18) searchers are ready to buy

---

## Killed Keywords

Keywords removed due to zero volume in Ahrefs/Semrush. Listed for transparency.

- [keyword 1], [keyword 2], [keyword 3], ...

---

## Comma-Separated List (For Tools)

[all keywords, comma-separated, ready to paste into Ahrefs/Semrush]
```

### After delivering the file
Tell the user:
1. Where the file was saved
2. Top easy wins to start with and why
3. Suggest next steps:
   - Use **write-seo-geo-content** to write pages for the top clusters
   - Use **geo-content-research** to build full AI-ready content pages for high-GEO keywords
   - Use **create-geo-charts** for data-driven keywords that need visualizations
   - If they haven't validated with Ahrefs/Semrush yet: "Want to paste these into Ahrefs to get real volume data? I'll re-filter based on the CSV."

---

## Rules

1. **Target keywords must be 1-3 words** — this is non-negotiable. Longer phrases go in Blog Topics or GEO Queries. Keywords like "teleoperation data collection for robots" are blog titles, not target keywords.
2. **No fabricated data** — do not invent search volumes. Use paid tool data when available, qualitative signals when not. Never estimate or guess a number.
3. **Kill dead keywords early** — if a keyword has no autocomplete presence, no PAA, no dedicated SERP results, and no volume in paid tools, remove it. A list of 50 real keywords beats 100 with half dead.
4. **This skill is SEO-focused** — SEO keywords (1-3 words) optimize pages for Google ranking. For GEO prompt targeting (full questions for AI citation), use the **geo-content-research** skill separately.
5. **Real language over marketer language** — prioritize the words actual users type, not industry jargon
6. **Interactive** — do not skip phases. Get user confirmation before moving to the next phase
7. **Output is actionable** — the deliverable should be directly usable for content planning without further analysis
8. **Integrate paid tools when available** — Ahrefs/Semrush data is always better than guessing. Offer to integrate it. But the skill works without it too.
