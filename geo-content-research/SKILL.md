---
name: geo-content-research
description: >
  Researches what prompts people ask AI engines (ChatGPT, Gemini, Perplexity, Claude) about a product category and
  produces prompts.csv — strictly NON-BRANDED (any prompt containing a brand alias is pruned as confirmation bias;
  it is the visibility battleground measurement). Branded accuracy/sentiment queries go to a companion
  brand_check.csv (2-4 rows). Adds first-party seed mining, AI-assisted prompt expansion, entity-competitor
  discovery, and a parameter-lock step before generation. Feeds the monitor workflow.
---

# GEO Content Research — Produce prompts.csv

You are a Generative Engine Optimization (GEO) strategist. Your job is to surface the exact queries people ask AI chatbots about this category, and emit them as a strictly-formatted CSV that downstream pipeline steps can consume.

The core insight: AI engines have no paid ranking. You can't buy a ChatGPT recommendation. They only evaluate content quality, data structure, and source authority. Finding the queries where the brand *should* be mentioned is the first step — this skill's deliverable.

> **Output contract:** Your final response text IS the deliverable. It MUST be raw CSV matching `prompts.csv.schema.md` exactly. No prose, no code fences, no explanation around the CSV. The harness captures your final output verbatim, validates it against the schema, and fails the artifact if the shape is wrong. See Phase 3 for the exact format.

> **Scope in autonomous mode:** Phases 1–3 only. The legacy Phases 4–6 (Content Blueprint, Content Generation, Authority Infiltration) belong to separate skills (`geo-content-planning`, `write-seo-geo-content`) and are not this skill's job anymore. Do the research, emit the CSV, stop.

---

## How This Skill Works

Three phases, executed in order:

1. **Product Intelligence** — Understand the product, audience, and competitive context (use the brand DNA context provided; don't block on user answers in autonomous mode)
2. **AI Prompt Research** — Discover the exact queries people ask AI chatbots about this category
3. **Emit prompts.csv** — Score, prioritize, and emit the strict CSV deliverable

Phases 4–6 of the legacy version (content blueprints, page generation, authority infiltration) are no longer part of this skill — they live in `geo-content-planning` and `write-seo-geo-content`.

---

## Phase 1: Product Intelligence Gathering

**Start here every time.** Ask the user for:

### Required information
1. **Product/brand name** and URL (if live)
2. **Product category** — what is it, what does it do in one sentence
3. **Target customer** — who buys this, what problem does it solve for them
4. **Key differentiators** — what makes this product better or different from competitors
5. **Price point** — approximate range (budget / mid-range / premium)
6. **Top 3 competitors** — brands users compare against
7. **Any existing content** — do they have a blog, reviews, product specs pages?

### What to do with the answers
- Identify the **product category keyword** (e.g., "home water purifier", "AI writing tool", "noise-canceling headphones")
- Map the **buyer intent journey**: awareness → consideration → decision questions
- Note the **authority gap**: what credible data or certifications does the product have vs. what AI might expect to see?

Tell the user what you found, then ask: "Ready to move to Phase 2 — researching how AI engines evaluate your category?"

---

## Phase 2: AI Prompt Research

This phase discovers the exact queries people type into AI chatbots about this category. You are building the raw material for the GEO Prompt Target Table.

**GEO prompts are NOT the same as SEO keywords.** SEO keywords are 1-3 word terms for Google ranking. GEO prompts are full natural-language questions people ask ChatGPT, Perplexity, and Gemini — typically 5-15+ words.

### Step 2-P: Parameter lock (v2 — book ch.15: "Before you add prompts, understand what you're actually measuring")

Decide and state these three BEFORE generating any prompt; they constrain what may enter the list:

| Parameter | Source | Consequence |
|---|---|---|
| **Engine set** | `brand_dna.md → AI Visibility Inputs → Platform mix` if `[owner]` data exists; else default (the engines geo-monitor actually runs) | Do not write `target_engines=claude` rows for a brand whose audience doesn't use Claude; a loss there measures nothing |
| **Mention terms** | `brand_dna.md → Brand Topics` (the full alias inventory — never a single name) | If Brand Topics is thin/missing → flag it; visibility numbers computed against a bad alias list are meaningless (book ch.15) |
| **Cadence** | how often geo-monitor realistically runs (weekly? per content cycle?) | Cadence slower than weekly ⇒ exclude time-sensitive prompts ("hôm nay", "tuần này", flash-sale phrasing) from the list entirely |

Present the locked parameters to the user, then proceed.

### Step 2A-0: First-party seed mining (v2 — the gold source, do this FIRST)

Real customer questions from the brand's own channels outperform anything you can imagine (book: "sales calls, customer service emails, live-chat transcripts... This is gold. It's literally what people ask.").

Ask the user for exports/screenshots of, in priority order:
1. Chat/inbox logs (Facebook Messenger, Shopee chat, Discord, Zalo) — last 3 months
2. Sales-call notes / objections heard repeatedly
3. Support tickets + FAQ from the site
4. Community threads where customers answer each other (VN: Facebook groups, VOZ/Tinh Tế threads addressed to the brand)

Extract 30–50 verbatim questions/phrases. Tag each seed `source: first_party`. If the user cannot supply any, record "no first-party data" in Phase 1 notes and continue — do NOT fabricate customer quotes.

### Step 2A: Discover prompts across 8 query types

Using web search, research the exact questions people ask. Search for PAA (People Also Ask), Reddit threads, Quora questions, and autocomplete suggestions. Organize into these 8 buckets:

#### 1. Definition prompts
- "What is [product/category]?"
- "How does [technology] work?"
- "What is the difference between [X] and [Y]?"
- "[X] vs [Y] — what's the difference?"

#### 2. Recommendation prompts
- "What is the best [product] for [use case]?"
- "Top [products] in [year]"
- "Which [product] should I choose?"
- "Best [product] for [audience segment]"

#### 3. Comparison prompts
- "[Product A] vs [Product B] — which is better?"  (A and B are the *options a buyer weighs* — models, shop types, service models. The tracked brand NEVER appears: a brand-vs-competitor prompt is competitor-branded and gets pruned, see Step 2D-P)
- "[service approach X] vs [service approach Y]" (e.g. "order qua trung gian vs tự order")
- "[Product] alternatives"

#### 4. Evaluation / trust prompts
Trust queries are high-value GEO targets — but ONLY in their non-branded form (a brand-named trust query always "wins" and measures nothing):
- "Is [product category / origin / service model] worth it?" ("hàng nội địa Trung có bền không", "mua qua trung gian có ổn không")
- "What are the pros and cons of [product type]?"
- "[service model] problems / risks / lừa đảo" — the doubt framing buyers type BEFORE they name a shop
- "Can I trust [shop type / channel]?"

#### 5. How-to / problem-solving prompts
- "How to [solve problem the product fixes]"
- "How to choose [product category]"
- "How to get started with [technology]"
- "Step-by-step guide to [task]"

#### 6. Cost / business prompts
- "How much does [product] cost?"
- "[Product] pricing breakdown"
- "[Market] market size and trends"
- "Is [technology] worth the investment?"

#### 7. Landscape / who prompts
- "What companies are building [technology]?"
- "[Category] startups to watch in [year]"
- "Who are the leaders in [space]?"
- "[Company] competitors"

#### 8. Use case / scenario prompts
- "Can [product] be used for [specific scenario]?"
- "How is [technology] used in [industry]?"
- "[Technology] in [vertical] — what's possible?"
- "Will [technology] replace [existing approach]?"

For each bucket, use web search to find real queries. Search patterns:
- `[category keyword]` — note PAA questions
- `[category] vs` — note comparison suggestions
- `best [category] for` — note use-case variants
- `how to choose [category]`
- `is [category] worth it`
- `[competitor name] vs` — note who gets compared
- `[category] companies list`

### Step 2A-2: Reddit Mining (Required)

Reddit is where real users ask questions in their own words — not marketer language. AI engines (especially ChatGPT and Perplexity) heavily crawl Reddit. This step is not optional.

Run these searches and read the actual threads:
- `site:reddit.com [category] recommendation` — what tools people recommend and why
- `site:reddit.com best [category] [current year]` — current favorites
- `site:reddit.com [category] vs` — how users compare options
- `site:reddit.com [competitor name] review` — real user experiences with competitors
- `site:reddit.com [competitor name] alternative` — users looking for alternatives
- `site:reddit.com [pain point the product solves]` — how users describe the problem

**What to extract from Reddit:**
- The exact words and phrases users type (these become GEO prompts)
- Pain points users describe that the product solves
- Which competitors get mentioned together (reveals natural comparison sets)
- Complaints about competitors (reveals differentiation angles)
- Questions that go unanswered (reveals content gaps = Easy Wins)

**Identify the 3-5 most relevant subreddits** for the category (e.g., r/sales, r/startups, r/Entrepreneur, r/coldemail). These also feed into the Authority Infiltration Plan (Phase 6).

**Aim for 60-100 raw prompts before deduplication.**

### Step 2A-3: AI-assisted prompt expansion (v2)

You are going to use AI to generate AI prompts (book p.139, "prompt archaeology → expansion"). Take your seed lists (first-party + PAA + Reddit + long-tails from research-keywords' `geo_seeds.csv` if present) and run the expansion template:

> "Using the copy below, generate 15 questions that a **[target customer — be specific, e.g. 'Vietnamese gamer on a budget buying Chinese-domestic monitors']** is likely to ask an LLM about **[topic]**."

Rules:
- Run the template 3+ times with different seed combinations; if browser access is available, run it once per engine (ChatGPT, Gemini, Claude) — each model produces different phrasing angles and that diversity is the point.
- Every expanded question must still sound like a human asking, in the customer's language (not marketer language).
- Tag each prompt's provenance in `notes`: `seed:first_party`, `seed:paa`, `seed:reddit`, `seed:longtail`, `seed:ai_expansion`.
- AI-expanded prompts are candidates, not discoveries — they earn a row only if the category plausibly has that question volume; prefer keeping them where mined seeds are thin (unanswered-question gaps).

### Step 2B: Map AI evaluation dimensions

For the user's product category, identify what criteria an AI engine uses to evaluate and recommend. These typically include:

- **Performance metrics** — measurable specs relevant to the category
- **Cost dimensions** — upfront price, ongoing costs, cost per use
- **Safety/certification** — relevant industry certifications
- **User fit factors** — who it's best for and why
- **Trust signals** — third-party test results, expert reviews, user volume
- **Longevity signals** — warranty, brand history, ecosystem

Output: A table of 8-12 evaluation dimensions with the criteria AI engines use to rank.

### Step 2C: Identify trusted sources

Research what sources AI engines currently cite for this category:
- Academic/research institutions
- Government regulatory bodies
- Industry associations and testing labs
- High-authority review sites
- Specific publications AI trusts for this niche
- Competitor content that gets cited

Output: List of 10-15 high-authority sources with their URLs.

### Step 2D: Score competition for each prompt

For each discovered prompt, assess:

1. **Citability** — How likely is AI to cite external sources when answering?
   - **High** = AI needs to reference specific sources (comparisons, data, recommendations)
   - **Med** = AI can answer from general knowledge but may cite
   - **Low** = AI answers from training data alone (basic definitions)

2. **Competition** — How many strong sources already answer this well?
   - **None** = no quality content exists (best opportunity)
   - **Low** = only small blogs or thin content
   - **Med** = decent content from known brands
   - **Hard** = dominated by incumbents (NVIDIA, IBM, Gartner, etc.)

### Step 2E: Entity-competitor discovery (v2 — book p.136)

In AI search your real competitors are **whoever the model's knowledge graph associates with you** — not your self-declared market rivals. "A smaller competitor with better-structured content might be stealing your AI visibility."

Method (browser-based if geo-monitor infra exists; otherwise infer from the top web results of each category prompt):
1. Run 3–5 general category prompts ("best X for Y", "where to buy X") through ≥1 engine.
2. Record every brand/source **actually named** in the answers and citations — these are your entity competitors.
3. Output an `entity_competitors` list to present to the user alongside the summary, and use it to:
   - replace/augment the Phase 1 user-declared competitor list for comparison prompts (`[X] vs [entity competitor]`)
   - populate `brand_mention_mechanism` with realistic adjacency ("named alongside A, B" — never invent the set, cite what you observed)
   - feed `build-backlinks` (where do entity competitors get mentioned that you don't appear)

### Step 2F: Prune with the ch.15 filter (v2 — do this before scoring/dedup)

Apply the book's keep-or-kill table to EVERY candidate prompt:

| Prompt type | Example | Verdict |
|---|---|---|
| Contains the tracked brand (any Brand-Topics alias) | "T-Order có uy tín không?" | ✖ prune from prompts.csv → candidate for `brand_check.csv` instead |
| Competitor-branded (names a rival, brand absent by construction) | "mua ở GearVN có tốt không?" | ✖ prune — can never surface you |
| Non-branded comparison (buyer's real dilemma, no shop named) | "tự order Taobao hay qua trung gian?" | ✔ keep — competitive battleground |
| General on-topic | "màn hình nội địa Trung mua ở đâu uy tín" | ✔ keep — category battleground |
| General off-topic | "màn hình hoạt động như thế nào" | ⚠ maybe — keep only if the answer plausibly routes to the brand's content |

The scan is mechanical: every prompt is lowercased and checked against the Step 2-P mention-terms list; a hit is a prune, no exceptions, no "but it's a great question". Prompts that survive become the visibility benchmark; the quality of the list is now bounded by the quality of the alias inventory from brand_dna.

A market rival absent from every AI answer is not your benchmark; a niche shop that appears everywhere is.

Present a summary: "Found X prompts across 8 categories (+ Y first-party, Z AI-expanded); pruned W branded/competitor-branded; entity competitors observed: [list]. Ready to build the GEO Prompt Target Table?"

---

## Phase 3: Emit prompts.csv (STRICT FORMAT)

Your final response **must be raw CSV content and nothing else**. The harness captures your final output verbatim, saves it as `prompts.csv`, and validates it against `prompts.csv.schema.md`. Any deviation fails the artifact.

### Absolute rules

1. **No prose before or after the CSV.** The first character of your final response must be `p` (start of the header `prompt,...`). The last character must be the final character of the last data row.
2. **No code fences.** Do not wrap the CSV in ` ``` ` or ` ```csv `. Just emit the CSV content.
3. **Exact header, exact order:**
   ```
   prompt,tier,citability,competition,priority,query_type,cluster,target_engines,brand_mention_mechanism,notes
   ```
4. **Exactly 10 fields per row.** Empty fields written as two adjacent commas.
5. **Quote fields containing commas, newlines, or double-quotes.** Escape embedded `"` as `""`. Most prompts contain no commas, so unquoted is usually fine.
6. **Minimum 20 data rows.** Fewer fails validation.
7. **ZERO brand aliases in the prompt column** (Step 2F is machine-enforced: any alias from the Brand-Topics inventory = artifact fails validation).

### Column contract

| # | Column | Type | Required | Allowed values |
|---|--------|------|----------|----------------|
| 1 | `prompt` | string | yes | full natural-language query, ≥ 5 words, unique (case-insensitive), **free of every brand alias** |
| 2 | `tier` | enum | yes | `buy` \| `solve` \| `learn` |
| 3 | `citability` | enum | yes | `high` \| `medium` \| `low` |
| 4 | `competition` | enum | yes | `none` \| `low` \| `medium` \| `hard` — judged from OBSERVED entity-competitor presence (Step 2E) where monitor data exists; not vibes |
| 5 | `priority` | enum | yes | `easy_win` \| `target` \| `skip` |
| 6 | `query_type` | enum | yes | `definition` \| `recommendation` \| `comparison` \| `evaluation` \| `how_to` \| `cost` \| `landscape` \| `use_case` |
| 7 | `cluster` | string | yes | non-empty, snake_case recommended |
| 8 | `target_engines` | string | yes | `\|`-separated subset of the **locked engine set** (Step 2-P); ≥ 1 |
| 9 | `brand_mention_mechanism` | string | yes | non-empty, concrete — no vague phrases like "builds awareness" |
| 10 | `notes` | string | no | free text; provenance tags from Step 2A-3 (`seed:first_party`, `seed:paa`, `seed:reddit`, `seed:longtail`, `seed:engine_chip`, `seed:ai_expansion`) go here |

### Semantic rules

- **Business-value tiers** (for the `tier` column):
  - `buy` — "Who should I use?" / "What's the best?" — brand named as option
  - `solve` — "How do I do this?" — brand's methodology is the solution
  - `learn` — "What is X?" — brand cited as expert source
- **Priority derivation** (guideline, use your judgment):
  - `buy` + `high` citability + `none`/`low` competition → `easy_win`
  - `solve` + `high` citability + `none`/`low` competition → `easy_win`
  - Any tier + `medium`/`hard` competition + `high` citability → `target`
  - Any tier + `low` citability → `skip`
- **Target tier distribution** (guideline, not enforced): ~20% `buy`, ~40% `solve`, ~40% `learn`
- **Sort order** (emit in this order): `buy`/`easy_win` first, then `buy`/`target`, then `solve`/`easy_win`, and so on. `skip` last.
- **Engine selection**: higher-value prompts should target multiple engines; niche or low-priority prompts may target just one
- **The non-branded guarantee (v2 — ch.15 pruning made structural)**: prompts.csv contains ONLY prompts a person could type without knowing the brand exists. That is the whole benchmark — "If you're showing up here, you're winning. If you're not, you know where to improve."
- **brand_check.csv (v2 — separate artifact, ch.14 RAPP)**: 2–4 branded trust queries ("is [brand] legit…", "[brand] warranty policy…", "[brand] vs [entity competitor]") are still worth asking — but they measure *Accuracy* and *Sentiment*, never visibility, so they live in their own file and their own report block. Emitted BEFORE the final response as a delimited block (same mechanics as research-keywords' geo_seeds handoff):
  ```
  ---BRAND_CHECK_BEGIN---
  prompt,focus,rationale
  is [brand] legit or a scam,accuracy|sentiment,what do engines repeat about the brand when asked directly
  [brand] warranty and return policy explained,sentiment,does the answer reflect real policy or stale/forum rumors
  ---BRAND_CHECK_END---
  ```
  `focus` ∈ `accuracy` (facts vs brand_dna evidence) | `sentiment` (positive/neutral/negative framing). The operator saves the block as `brand_check.csv`; geo-monitor runs these rows flagged so they never enter the visibility denominator.

### Example (what your entire final response must look like)

```
prompt,tier,citability,competition,priority,query_type,cluster,target_engines,brand_mention_mechanism,notes
what is the best geo optimization platform,buy,high,low,easy_win,recommendation,geo_platforms,chatgpt|perplexity|claude|gemini,named in top-5 list alongside profound and otterly,seed:paa
how do i optimize content for ai citations,solve,high,medium,target,how_to,content_strategy,chatgpt|perplexity|claude,brand methodology cited as reference approach,
tự order hàng taobao so với thuê dịch vụ trung gian cái nào rủi ro ít hơn,buy,high,none,easy_win,comparison,order_service,chatgpt|perplexity|gemini,brand's cost-vs-risk comparison table cited as the service option,seed:reddit
best ai visibility tracking tools 2026,buy,high,low,easy_win,recommendation,geo_platforms,chatgpt|perplexity|gemini,named alongside otterly and geoptic per observed answers,seed:engine_chip
how to measure llm citation rates,solve,high,low,easy_win,how_to,measurement,chatgpt|perplexity,brand's dashboard cited as measurement solution,seed:ai_expansion
what is generative engine optimization,learn,medium,hard,skip,definition,geo_fundamentals,chatgpt,brand cited via byline on definition page,
```

(Above is illustrative — your actual CSV has 20+ rows, and **none of them contains the brand's name or any alias from Brand Topics**.)

### Before emitting

Run the checklist:
- [ ] Step 2-P parameters (engine set / mention terms / cadence) stated before generation
- [ ] Final response starts with `prompt,tier,citability,competition,priority,query_type,cluster,target_engines,brand_mention_mechanism,notes\n`
- [ ] No code fences anywhere
- [ ] No prose before or after
- [ ] ≥ 20 data rows
- [ ] Every row has exactly 10 comma-separated fields
- [ ] Every enum value is from the allowed set (exact spelling, lowercase snake_case)
- [ ] **No prompt text contains any brand alias from Brand Topics** (scan every row — one hit fails the artifact)
- [ ] brand_check.csv block emitted BEFORE the final response (2–4 rows) — never inside the final CSV
- [ ] No duplicate prompts (case-insensitive)
- [ ] Every `target_engines` value uses `|` as separator and stays within the locked engine set
- [ ] Every `brand_mention_mechanism` is concrete, not vague

Then emit the CSV. Nothing else.

---

## Phase 4: Content Blueprint

Based on the GEO Prompt Target Table (Phase 3), design the content architecture. Each content page should target a cluster of related prompts. Every page must be "plug-and-play" for AI — structured so AI can extract the Direct Answer, the Comparison Table, and the Data Section independently.

### The 7 AI-ready content page types

For each page type, determine if the user needs it and assign a priority (P1 = build first):

#### Page Type 1: Category Guide (P1)
- URL: `/[product-category]-guide` or `/how-to-choose-[product]`
- H1: "How to Choose [Product]: [N] Criteria Experts Use"
- Purpose: Owns the "how to choose" query. AI cites this as the definitive selection guide.
- Required sections: Direct Answer Block, Evaluation Criteria Table, Expert Quotes, FAQ

#### Page Type 2: Comparison Hub (P1)
- URL: `/best-[product-category]` or `/[product]-comparison`
- H1: "Best [Products] in [Year]: [Brand] vs [Competitor 1] vs [Competitor 2] Compared"
- Purpose: Owns "best X" queries. AI uses comparison tables to answer "which is better" questions.
- Required sections: Top Pick Summary, Full Comparison Table (8+ criteria), Individual Reviews, FAQ
- For the comparison table, consider using the **create-geo-charts** skill to render a visual comparison bar chart alongside the HTML table — this gives AI engines two extractable formats

#### Page Type 3: Data & Evidence Page (P1)
- URL: `/[product]-test-results` or `/[product]-performance-data`
- H1: "[Product] Independent Test Results: [Key Metric] Performance"
- Purpose: Provides verifiable data AI can cite as evidence. Must contain real test data, not marketing claims.
- Required sections: Test methodology, Data tables with numbers, Third-party verification, Charts
- Use the **create-geo-charts** skill for all charts on this page — each chart needs the full GEO text layer (action title, key finding summary, HTML data table, CSV download, Dataset JSON-LD)

#### Page Type 4: Use Case Pages (P2)
- One page per major use case identified in Phase 2
- URL: `/[product]-for-[use-case]` (e.g., `/water-purifier-for-apartments`)
- Purpose: Owns "X for [specific situation]" queries
- Required sections: Direct Answer for this use case, Why this matters, Recommended options for this context, FAQ

#### Page Type 5: Myth-Busting / FAQ Page (P2)
- URL: `/[product]-questions-answered` or `/[product]-myths`
- H1: "Is [Product] Worth It? Your Top Questions Answered with Data"
- Purpose: Captures doubt/trust queries. Shows up when users are close to buying but need reassurance.
- Required sections: Direct answer to the "worth it" question, Data-backed answers to each objection, Real user scenarios

#### Page Type 6: Glossary / Technical Reference (P3)
- URL: `/[product]-glossary` or `/[product]-technical-guide`
- Purpose: Becomes the authoritative definition source AI cites when explaining terminology
- Required sections: Term definitions with measurements, Standards references, How terms relate to product choice

#### Page Type 7: Brand Story / About Page (P3)
- Purpose: Establishes who made this, why, and what qualifies them
- Required sections: Founder/team expertise, Testing methodology, Data sources used, Contact/verification info

### Blueprint output format

Present a prioritized table:

| Priority | Page Type | Suggested URL | Target Query | Why AI Will Cite It |
|---|---|---|---|---|
| P1 | Category Guide | /how-to-choose-[X] | "how to choose [X]" | Covers all evaluation criteria in one place |
| P1 | Comparison Hub | /best-[X] | "best [X] 2025" | Has structured comparison table AI can extract |
| ... | ... | ... | ... | ... |

Ask: "Which pages do you want to build first? I'll write them one at a time in Phase 5."

---

## Phase 5: Content Generation

Generate content one page at a time. For each page:

1. Ask the user for any specific data, test results, or claims they want included
2. Do web research to find real statistics and authoritative sources for this page
3. Write the full page content
4. Include a structured data JSON-LD block for the page
5. Ask if the user wants changes before moving to the next page

### Content template: every page must have these zones

#### Zone 1: Direct Answer Block (40-60 words)
The most important zone. AI extracts this verbatim to answer user questions.

```
## [Question format H2 — match exact user query]

[Product category] [does X] by [mechanism]. [Key differentiator of this product].
[Primary outcome for the buyer]. [One concrete measurement or fact].
```

Rules:
- Under 60 words
- Contains at least 1 specific number or measurement
- No pronouns referring to prior context — must stand alone
- Answers the H2 question directly in sentence 1

#### Zone 2: Comparison Table
AI extracts comparison tables to answer "which is better" and "X vs Y" questions.

Format:
```
| Criteria | [Your Product] | [Competitor 1] | [Competitor 2] |
|---|---|---|---|
| [Metric 1] | [Value] | [Value] | [Value] |
| [Metric 2] | [Value] | [Value] | [Value] |
```

Rules:
- Minimum 5 criteria, maximum 10
- All values must be verifiable — link to sources
- Include criteria where your product wins AND criteria where it doesn't — AI trusts balanced content
- Last row: Overall verdict with plain language recommendation

#### Zone 3: Data & Evidence Section
AI cites pages with verifiable data. Every claim needs a source.

Format for each data point:
```
[Specific claim with number]. According to [Source Name], [supporting context] ([year]).
```

Rules:
- Minimum 5 data points per page
- Every number linked to primary source
- Include third-party test data where available (certification bodies, labs, consumer organizations)
- Date every claim — freshness matters to AI

#### Zone 4: Scenario Solutions
AI answers "X for [situation]" by citing pages that address specific scenarios.

Format per scenario:
```
### For [Specific User Type]
**The problem**: [Specific situation they face]
**What matters most**: [2-3 criteria that matter for this scenario]
**Recommended approach**: [Specific guidance]
**Why**: [Evidence or reasoning with source]
```

Minimum 3 scenarios per page, matched to the use case questions from Phase 2.

#### Zone 5: FAQ Section
Format each Q&A to be extractable as a standalone answer:

```
### [Exact question users ask — match People Also Ask phrasing]
[Direct answer in 1-2 sentences]. [Supporting detail]. [Source if applicable].
```

Rules:
- 6-8 questions per page
- Each answer complete on its own — no "as mentioned above"
- Include at least 1 pricing/cost question, 1 comparison question, 1 how-to question
- Add FAQPage JSON-LD schema

### Structured data for every page

After writing each page, generate the appropriate JSON-LD:

**For product/comparison pages** — Product + Review + Comparison composite:
```json
{
  "@context": "https://schema.org",
  "@type": ["Product", "ItemList"],
  "name": "[Page Title]",
  "description": "[Direct Answer Block text]",
  "review": {
    "@type": "Review",
    "reviewRating": { "@type": "Rating", "ratingValue": "X", "bestRating": "5" },
    "author": { "@type": "Organization", "name": "[Brand]" }
  }
}
```

**For FAQ sections** — FAQPage:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Q1]",
      "acceptedAnswer": { "@type": "Answer", "text": "[A1]" }
    }
  ]
}
```

**For how-to pages** — HowTo:
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "[Title]",
  "step": [
    { "@type": "HowToStep", "name": "[Step Name]", "text": "[Step Description]" }
  ]
}
```

**For data/claims pages** — ClaimReview (for each key claim):
```json
{
  "@context": "https://schema.org",
  "@type": "ClaimReview",
  "claimReviewed": "[Exact claim text]",
  "author": { "@type": "Organization", "name": "[Brand]" },
  "reviewRating": {
    "@type": "Rating",
    "alternateName": "True",
    "ratingValue": "1",
    "bestRating": "1",
    "worstRating": "-1"
  },
  "url": "[Source URL]"
}
```

Generate content for each priority page. After each page ask: "Page complete. Want to edit anything, or should I move to the next page?"

---

## Phase 6: Authority Infiltration Plan

The last phase. After content exists on the website, build the off-site signals that make AI engines trust your site as a primary source.

AI engines don't trust isolated websites. They trust sources that are cited by other trusted sources. The goal: get your content referenced on platforms AI regularly crawls.

### For each platform, generate a specific action plan

#### Quora (High Priority — ChatGPT crawls Quora heavily)
- Search for existing questions in your category
- Write 3-5 answers to high-view questions where your data page is a credible source
- Format: Answer fully first (don't require clicking the link), then: "I documented the full test methodology and data at [URL] if you want the primary source."
- Include your specific statistics in the answer body

Action output: List 5 specific Quora questions to answer, with a draft answer outline for each.

#### Reddit (High Priority — AI crawls subreddit discussions)
- Identify the 3-5 most relevant subreddits for the category
- Strategy: Post data-only content (no promotion), establish expertise, website in profile only
- Format: "I ran [test/comparison] for [N] months. Here's what I found: [data table]. Happy to share more."
- Never post links in the post itself — only in profile bio

Action output: List target subreddits, draft 2 post concepts with data-first framing.

#### Medium (Medium Priority — AI cites Medium thought leadership)
- Write 1 deep analysis article: "[Category] Industry Analysis: What the Data Actually Shows"
- Include your comparison tables, cite primary sources (including your own data pages)
- Tag correctly for the category topic
- Link to your data pages as the primary source

Action output: Medium article outline with suggested title and section structure.

#### Wikipedia (Selective — only if you have genuinely novel data)
- Find the Wikipedia article for the product category
- Identify if your test data page qualifies as a reference (must be genuinely informative, not promotional)
- If yes: add to References or External Links section only if the data is unique and verifiable
- If no: do not touch Wikipedia — it will be removed and flagged

Action output: Identify the relevant Wikipedia article, assess if your content qualifies, and specify exactly which section and format.

#### Industry Forums / Niche Communities
- Identify 3-5 industry-specific forums or communities (home improvement forums, specialty retailer communities, trade association sites)
- Strategy: Become the data expert. Answer technical questions with your data.
- Profile bio or signature: website URL only

Action output: List target communities with discovery search queries to find them.

### Flywheel effect

Explain to the user: Once one AI engine cites your content, the snowball starts:
1. ChatGPT recommendation → user screenshots and posts to Reddit
2. Reddit discussion → Claude crawls and cites the thread
3. Claude citation → Perplexity references Claude's sources
4. Perplexity listing → more websites cite Perplexity's recommendations
5. Your brand appears in every AI engine's training context

This is why content quality compounds: being cited once leads to being cited everywhere.

---

## Verification: Test Your GEO Standing

After all phases are complete, tell the user how to test their current AI visibility:

### Manual AI testing protocol
Ask these exact queries in ChatGPT, Gemini, and Perplexity:

1. "What is the best [product category] right now?"
2. "How do I choose a [product]?"
3. "Is [your brand name] a good [product]?"
4. "What are the pros and cons of [your product name]?"
5. "[Your product] vs [top competitor] — which is better?"

Record: Does your brand appear? Which pages are cited? What is said?

### What good looks like
- Brand mentioned in response body (not just a cited link) = high GEO visibility
- Your data page cited as a source = content is trusted
- Your comparison table content quoted = structured data is working
- FAQ answer extracted verbatim = snippet optimization is working

### What to do if not appearing
- Check that AI bots are not blocked in robots.txt (run aeo-audit.sh if available)
- Verify structured data is valid (use Google Rich Results Test)
- Confirm content has been published for at least 2-4 weeks (indexing lag)
- Check if your data pages have fewer than 250 words — they need substantive content
- Re-run Phase 2 to identify if you're targeting the right query types

---

## Quick Reference: What AI Engines Weight Most

| Signal | Weight | How to Optimize |
|---|---|---|
| Direct Answer Block | Very High | 40-60 word H2-anchored answer at top of each section |
| Comparison Table | Very High | 5+ criteria table with verifiable values |
| Cited Statistics | High | Every number has an inline named source |
| Named Expert Quotes | High | Direct quotes from named experts with credentials |
| Freshness | High | Published/updated date visible on page + in meta |
| FAQPage Schema | High | All FAQ content wrapped in FAQPage JSON-LD |
| Internal Link Depth | Medium | Pages link to your data pages as the authority source |
| Off-site Citations | Medium | Pages referenced from Quora, Reddit, Medium discussions |
| Page Word Count | Medium | 1,500+ words for authority pages, 800+ for use case pages |
| HTTPS + Technical | Low | Required baseline but not a differentiator |
