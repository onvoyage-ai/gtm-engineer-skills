# AEO/GEO Audit — anthropic.com

**Audited:** 2026-05-16 · **Pages crawled:** 6

> Example output produced by `audit-website-aeo`. Real crawl data; the
> intelligence scores below were assigned by reading the page excerpts.

## Score

| | Score | |
|---|---|---|
| Foundational (16 checks) | 72/100 | |
| Intelligence (6 dimensions) | 63/100 | |
| **Final** | **68/100** | **Grade: C+** |

The site is technically clean and well-written, but missing structured-data
and freshness signals keep it from being an easy, confident citation source.

## Foundational Checks

| | Check | Detail |
|---|---|---|
| ✗ | Structured data present | 2/6 pages passed |
| ✗ | Schema types identified | 2/6 pages passed |
| ✗ | Content structure | 2/6 pages passed (heading levels skipped/single-level) |
| ✗ | llms.txt valid | No llms.txt found |
| ✗ | RSS/Atom feed | No RSS/Atom feed found |
| ✓ | Clear page title | 6/6 |
| ✓ | Meta description | 6/6 |
| ✓ | Canonical URL | 6/6 |
| ✓ | Single H1 heading | 6/6 |
| ✓ | Open Graph basics | 6/6 |
| ✓ | Internal linking | 6/6 |
| ✓ | Image alt coverage | 5/6 |
| ✓ | Readable content depth | 6/6 |
| ✓ | Indexable for discovery | 6/6 |
| ✓ | AI-accessible meta tags | 6/6 |
| ✓ | AI bot access | No AI bots blocked in robots.txt |

## Intelligence Evaluation

**Answer Readiness — 3/5 (60/100).** Product and guidance pages lead with clean
definitions ("Anthropic Interviewer is a research tool, powered by Claude,
that…"); the homepage is promotional and navigational. *Several questions
answerable, but no FAQ-first structure across the site.*

**Quotability — 4/5 (80/100).** Self-contained passages and concrete metrics
("Claude Haiku 4.5 scores 73.3% on SWE-bench Verified") are easy to extract;
two pages carry FAQPage structure. *Strong — clear answer blocks and lists.*

**Evidence Density — 3/5 (60/100).** Product pages cite hard numbers and
sample sizes ("1,250 professionals", "81,000 people"); value/careers pages run
on qualitative copy. No author attribution anywhere. *Uneven — strong on
product pages, thin elsewhere.*

**Content Depth — 3/5 (60/100).** Every page clears the depth threshold, but
the crawl surfaced only home + miscellaneous pages — no docs or blog corpus.
*Adequate; lacks a deep knowledge section.*

**Freshness — 3/5 (60/100).** Some pages show visible recent dates ("Last
updated Jul 10, 2025"), but these are inline text, not machine-readable
`article:modified_time` meta tags — and there is no RSS feed. *Current content,
weak machine-readable freshness signals.*

**Structural Clarity — 3/5 (60/100).** Single H1 and clean titles throughout,
but heading hierarchy passes only 2/6 pages and the homepage extract is noisy
with repeated nav text. *Readable, but the outline does not chunk cleanly.*

## Prioritized Fixes

1. **Add JSON-LD structured data to all key templates** *(High impact / Medium
   effort)* — only 2/6 pages carry any schema. Add `Organization` + `WebSite`
   site-wide, `Article` to content pages, `Product`/`SoftwareApplication` to
   model pages. Agents rely on this to classify entities.
2. **Publish a valid `llms.txt`** *(Medium / Low)* — none exists. A heading +
   curated links gives AI systems a trusted index of the site.
3. **Emit machine-readable date meta tags** *(Medium / Low)* — convert visible
   "Last updated" dates into `article:published_time` /
   `article:modified_time`. Freshness is a top citation driver.
4. **Fix heading hierarchy** *(Medium / Low)* — 4/6 pages skip levels or use
   one. Enforce H1 → H2 → H3 so passages chunk cleanly.
5. **Add an RSS/Atom feed** *(Medium / Low)* — helps AI systems discover new
   announcements and releases.

## Weakest Pages

| Score | URL |
|---|---|
| 73% | https://www.anthropic.com/ |
| 80% | https://www.anthropic.com/about-anthropic-interviewer |
| 86% | https://www.anthropic.com/candidate-ai-guidance |

## Recommendation

The biggest, lowest-effort win is structured data — it fails on two-thirds of
pages and is a hard prerequisite for AI classification. Combined with `llms.txt`
and machine-readable dates, these fixes would lift the foundational score into
the 80s. Run `improve-aeo-geo` against the site's codebase to apply them, then
re-run this audit to confirm the delta.
