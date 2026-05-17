---
name: audit-website-aeo
description: Audits a live website for AI-engine discoverability (AEO/GEO). Crawls the site, runs 16 deterministic checks plus a 6-dimension content evaluation, and produces a scored report (A-F) with prioritized fixes. Use to get a baseline before improve-aeo-geo, or to measure progress after changes.
---

# Audit Website AEO/GEO Skill

You audit a **live website** the way an AI agent would — crawling its pages, parsing structure, and judging whether the content is citation-worthy for ChatGPT, Claude, Perplexity, and Google AI Overviews.

The audit has two halves:

- **Foundational (50%)** — 16 deterministic pass/fail checks run by a script. Reproducible, no judgment.
- **Intelligence (50%)** — 6 content-quality dimensions **you** score by reading the pages, using the rubric below.

Final score = `0.5 × foundational + 0.5 × intelligence`, mapped to an A-F grade.

This skill produces a **diagnosis**. To then fix a codebase, hand off to the **`improve-aeo-geo`** skill.

---

## Workflow

Follow this sequence exactly.

### Step 1: Get inputs

Ask the user for:

1. **Website URL** (required) — the live site to audit.
2. **Crawl depth** (optional) — how many pages to crawl. Default 10, max 30.
3. **Output location** (optional) — where to save the report. Default: current directory, or `workspace/<customer-name>/` if working a customer project.

If the user already gave a URL when invoking the skill, don't re-ask — just confirm crawl depth and proceed.

### Step 2: Run the deterministic audit

Run the bundled script from this skill's `scripts/` directory. It requires only Node 18+ — no `npm install`.

```bash
node <skill-path>/scripts/aeo-audit.mjs <url> --max-pages=10 --out=<output-dir>/aeo-audit.json
```

The script crawls (sitemap + robots.txt + internal links), runs the 16 checks per page, aggregates site-wide, and writes a JSON report. It also prints a human-readable summary. Tell the user the foundational score and the failed checks.

If the script errors (site unreachable, 0 pages crawled), report the error and stop — don't fabricate a score.

### Step 3: Read the JSON report

Read the `aeo-audit.json` file. The key fields:

- `scoring.foundationalScore` — the deterministic score (0-100). This is **final** — do not change it.
- `checks` — the 16 site-wide checks with pass/fail and details.
- `pagesForReview` — up to 5 representative pages (home + richest content pages), each with an `aiView` object containing `title`, `metaDescription`, `h1`, `headings`, `schemaTypes`, `jsonLdSummary`, `textExcerpt`, `internalLinkCount`, `author`, `publishedDate`, `modifiedDate`. **Use these for Step 4.**
- `prioritizedFixes`, `worstPages`, `coverage`, `heuristicIntelligenceSignals` — supporting context. The heuristic signals are a deterministic *prior* — a sanity check, not the real evaluation.

### Step 4: Score the 6 intelligence dimensions

You are an AI agent that just found this site via web search. A user asked you a question and you landed here. **Decide: would you cite this site in your answer?**

Read the `textExcerpt`, `headings`, and metadata of each page in `pagesForReview`. Then score all 6 dimensions below, each **0-5**, using only what you actually observed (no assumptions about pages you didn't see). Write the rationale **before** the score.

#### Rubric (0-5 each)

**Answer Readiness** — If a user asked a question about this site's topic, could you find a direct answer here? The #1 factor — content answering questions in the first paragraph gets 4.8x more citations.
- 0 = No answers; purely promotional or navigational
- 1 = Vague content that talks around topics but never directly answers
- 2 = Some answers exist but buried deep, not in opening paragraphs
- 3 = Several questions answerable; some definition-first or FAQ-style content
- 4 = Most common questions answerable; answers lead sections
- 5 = Exceptional (dedicated FAQ blocks, definition-first paragraphs, Q&A format throughout)

**Quotability** — Can you extract a clean, self-contained 40-60 word passage to quote? Comparison tables get 2.8x citations; FAQ blocks +156%.
- 0 = No extractable content (interactive-only, single dense block)
- 1 = Content requires full-page context; no passage stands alone
- 2 = A few passages extractable but most need surrounding context
- 3 = Several self-contained paragraphs; some lists or structured blocks
- 4 = Good quotability (tables, lists, FAQ sections, clear answer blocks)
- 5 = Highly quotable (comparison tables, step-by-step blocks, definition paragraphs throughout)

**Evidence Density** — Statistics, data points, named sources, in-text citations? Adding in-text citations = +115% visibility; statistics = +40% citation rate.
- 0 = No evidence; only marketing copy and vague claims
- 1 = Vague claims only ("best in class", "industry leading")
- 2 = Mostly generalities; rare specific data points
- 3 = Some statistics and named sources; cites a few external sources
- 4 = High density (numbers, dates, named sources, links to references)
- 5 = Exceptional (statistics every 150-200 words, in-text citations throughout, verifiable metrics)

**Content Depth** — Enough substance to thoroughly answer questions on the topic? Long-form (2000+ words) gets 3x more citations.
- 0 = Empty or placeholder content only
- 1 = Minimal (a few sentences, no real substance)
- 2 = Thin (surface-level, missing key details a user would need)
- 3 = Adequate (covers main points but lacks sub-topics or examples)
- 4 = Rich (comprehensive coverage, multiple sub-topics, examples, data)
- 5 = Exceptional (authoritative depth, multi-faceted, a go-to reference)

**Freshness** — Current enough to cite confidently? 76% of ChatGPT's most-cited pages were updated in the last 30 days.
- 0 = No date signals; content appears abandoned or timeless-generic
- 1 = Dates present but clearly outdated (2+ years, stale references)
- 2 = Moderately dated; no "last updated" indicator
- 3 = Reasonably current OR explicit "last updated" date visible
- 4 = Recent content with update timestamps and current references
- 5 = Clearly current (recent dates, active maintenance evident)

**Structural Clarity** — Does the HTML parse cleanly into readable text? A prerequisite — clean heading hierarchy = 3.2x more citations.
- 0 = Unreadable (no text, blocked, non-semantic markup)
- 1 = Very poor (walls of text, no headings, topic unclear)
- 2 = Weak (some structure but confusing or inconsistent headings)
- 3 = Adequate (clear headings and paragraphs, topic identifiable)
- 4 = Good (clean H1-H2-H3 hierarchy, scannable, purpose obvious)
- 5 = Excellent (perfect heading outline, semantic HTML, zero noise)

For each dimension, record: a 1-2 sentence rationale, the 0-5 score, and a one-line key finding (under 14 words).

### Step 5: Compute the final score

1. **Intelligence score** = `average(6 dimension scores) × 20` → rounds each 0-5 to 0-100.
2. **Final score** = `round(0.5 × foundationalScore + 0.5 × intelligenceScore)`.
3. **Grade** from the final score:

| Grade | Range | Grade | Range | Grade | Range |
|---|---|---|---|---|---|
| A+ | 95-100 | B+ | 80-84 | C | 60-64 |
| A | 90-94 | B | 75-79 | C- | 55-59 |
| A- | 85-89 | B- | 70-74 | D | 40-54 |
| | | C+ | 65-69 | F | below 40 |

Sanity-check your intelligence score against `heuristicIntelligenceSignals` in the JSON. If they diverge by more than ~25 points on any dimension, re-read that page's excerpt and confirm your score is grounded in observed content.

### Step 6: Write the audit report

Write a Markdown report to `<output-dir>/aeo_audit_report.md` using the format in **Report Format** below. Then summarize for the user: the grade, the 3 highest-impact fixes, and a one-line recommendation.

### Step 7: Hand off

If the user wants to act on the findings:
- **To fix a codebase** → recommend the **`improve-aeo-geo`** skill, passing this report as input.
- **To re-measure after fixes** → re-run this skill on the same URL and compare scores.

---

## The 16 deterministic checks

Run by the script. For reference (id — what it verifies — points):

| Check | Verifies | Pts |
|---|---|---|
| `title` | `<title>` present, 10+ chars | 10 |
| `meta-description` | Meta description present, 50+ chars | 10 |
| `canonical` | `<link rel="canonical">` present | 8 |
| `h1` | Exactly one `<h1>` | 8 |
| `schema` | At least 1 JSON-LD block | 8 |
| `schema-types` | A recognized schema.org `@type` is used | 8 |
| `og` | `og:title` and `og:description` present | 8 |
| `internal-links` | 5+ internal links | 10 |
| `image-alt` | 80%+ of images have alt text | 8 |
| `text-depth` | 250+ words of body text | 12 |
| `indexability` | No `noindex` directive | 10 |
| `ai-meta-tags` | No `nosnippet` / `noai` / `noimageai` | 6 |
| `heading-hierarchy` | 2+ heading levels, no skipped levels | 6 |
| `llms-txt` | Valid `llms.txt` (heading + links + 100+ chars) | 10 |
| `ai-bot-access` | robots.txt does not block 9 major AI crawlers | 12 |
| `rss-feed` | RSS or Atom feed discoverable | 8 |

A site-wide check passes when **80%+ of crawled pages** pass it (the script handles aggregation). Foundational score = earned points ÷ 142 × 100.

---

## Report Format

```markdown
# AEO/GEO Audit — [domain]

**Audited:** [date] · **Pages crawled:** [N]

## Score

| | Score | |
|---|---|---|
| Foundational (16 checks) | XX/100 | |
| Intelligence (6 dimensions) | XX/100 | |
| **Final** | **XX/100** | **Grade: X** |

[One-sentence verdict on AI-citation readiness.]

## Foundational Checks

[Table of the 16 checks: ✓/✗, label, detail. Group failures at the top.]

## Intelligence Evaluation

For each of the 6 dimensions: score (X/5 → XX/100), rationale, key finding.

## Prioritized Fixes

Numbered list, highest impact first. For each: what to change, why it matters,
impact/effort. Pull from `prioritizedFixes` and your dimension findings.

## Weakest Pages

[From `worstPages` — URL and per-page %.]

## Recommendation

[2-3 sentences: biggest opportunity, and whether to run improve-aeo-geo next.]
```

---

## Rules

- **Never fabricate the crawl.** Always run the script. If it fails, report the failure — don't invent pages or scores.
- **The foundational score is the script's output.** Don't recompute or adjust it.
- **Score intelligence only from observed content.** Base every dimension score on `textExcerpt` / `headings` / metadata in `pagesForReview`. No assumptions about unseen pages.
- **Rationale before score.** Write why, then the number — for every dimension.
- **One report file**, saved to the output directory. Don't scatter partial outputs.
- This skill **diagnoses**; it does not edit code. Code fixes are the job of `improve-aeo-geo`.

---

## Research References

All statistics above are from verifiable primary research:

| Claim | Source |
|---|---|
| Quotations = +41% visibility; Statistics = +33%; Cite Sources = +28%; in-text citations = +115% for lower-ranked sites | Aggarwal et al., "GEO: Generative Engine Optimization," KDD 2024 ([arXiv](https://arxiv.org/abs/2311.09735)) |
| 44.2% of ChatGPT citations from first 30% of content | Kevin Indig, Growth Memo, Feb 2026 — 1.2M AI answers |
| Comparison tables 2.8x citations; FAQ blocks +156% | AirOps, 2025 — structuring content for LLMs |
| Clean heading hierarchy = 3.2x more citations vs unstructured | AirOps, 2025 |
| 76% of ChatGPT's most-cited pages updated within 30 days; AI cites content 25.7% fresher than organic | Ahrefs, 2025 — 17M citations across 7 AI platforms |
| Long-form (2000+ words) gets 3x more citations | SE Ranking, Nov 2025 — 2.3M pages, 295K domains |
