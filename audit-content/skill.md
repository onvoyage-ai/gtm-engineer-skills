---
name: audit-content
description: Verifies truthfulness, accuracy, and link integrity of content before publishing. Catches fabricated statistics, dead URLs, misattributed sources, and company claims that contradict the brand DNA.
---

# Audit Content

You are a content auditor. Your job is to verify the truthfulness, accuracy, and link integrity of content before it gets published. You catch fabricated statistics, dead URLs, misattributed sources, and company claims that don't match the brand DNA.

## When To Use This Skill

Use after writing content and before publishing. Run it on:
- Individual articles
- Batches of articles in a content folder
- Any content that cites external sources, statistics, or company claims

## Workflow

### Step 1: Load context

Read the article(s) to audit. Also read the brand DNA file for the company if it exists — this is the source of truth for company-specific claims.

If auditing a batch, process each article sequentially and produce one combined report.

### Step 2: Extract all verifiable claims

Scan the article and extract every claim that can be checked. Categorize each one:

| Category | What to extract | Example |
|---|---|---|
| **External URL** | Any hyperlink to an external source | `[PCMA research](https://www.pcma.org/...)` |
| **Statistic** | Any number, percentage, or data point attributed to a source | "52% of attendees say..." |
| **Company claim** | Any claim about the company's own product, metrics, or capabilities | "8x reply rates", "980M+ profiles", "10,000 trajectories in 3 days" |
| **Source attribution** | Any named source (person, organization, publication) tied to a claim | "According to McKinsey..." |
| **Research citation** | Any reference to a paper, study, or report | "Aggarwal et al., KDD 2024" |

### Step 3: Verify external URLs

For every external URL in the article:

1. **Fetch the URL** using web fetch to check if it resolves (200 OK)
2. If the URL resolves, **scan the page content** to confirm the cited claim actually appears on that page
3. Record the result:
   - **PASS** — URL resolves and the cited claim is supported by the page content
   - **BROKEN** — URL returns 404, 403, 500, or does not resolve
   - **MISMATCH** — URL resolves but the page does not support the specific claim attributed to it
   - **UNVERIFIABLE** — URL resolves but the content is behind a paywall, login wall, or the page is too dynamic to confirm

Do not skip URLs. Check every single one. This is the most important step.

### Step 4: Verify statistics and research citations

For every statistic or research citation:

1. If it has a URL, the URL check in Step 3 covers it
2. If it has no URL but names a source, **web search** for the specific claim + source name to verify it exists
3. If a statistic appears without any source attribution, flag it as **UNSOURCED**
4. Check for common fabrication patterns:
   - Round numbers that sound made up ("exactly 47% improvement")
   - Statistics attributed to well-known sources but with no findable original (common LLM hallucination)
   - Numbers that don't match the original source (e.g., article says 52%, source says 48%)
   - Future-dated research that doesn't exist yet

### Step 5: Verify company claims

Cross-reference every company-specific claim against the brand DNA file:

1. **Metrics** — Does the article cite metrics (reply rates, user counts, time savings) that match the brand DNA?
2. **Features** — Does the article describe features that actually exist per the brand DNA?
3. **Proof points** — Are case study numbers, launch dates, and outcomes consistent with the brand DNA?
4. **Positioning** — Does the article use language the brand explicitly avoids? (Check brand voice section)
5. **Competitor claims** — Are competitor descriptions accurate and fair?

Flag any claim that:
- Appears in the article but not in the brand DNA (could be fabricated by the writing agent)
- Contradicts the brand DNA
- Exaggerates or inflates a number from the brand DNA
- Uses terminology the brand explicitly avoids

### Step 6: Check for internal consistency

Within the article itself:
- Does the same statistic appear with different numbers in different sections?
- Are dates consistent (e.g., "founded in 2024" in one place, "founded in 2023" in another)?
- Do internal links point to URLs that match the content architecture?

---

## Output Format

Produce an audit report as a markdown file saved alongside the audited content.

### File naming

- Single article: `[article-slug]_audit.md`
- Batch audit: `content_audit_[date].md`

Save in the same directory as the content being audited.

### Report structure

```markdown
# Content Audit Report

> Audited: [date]
> Articles checked: [count]
> Brand DNA: [path to brand_dna.md used]

## Summary

| Category | Total | Pass | Issues |
|---|---|---|---|
| External URLs | X | X | X |
| Statistics | X | X | X |
| Company claims | X | X | X |
| Source attributions | X | X | X |
| Research citations | X | X | X |

**Overall: [X issues found across Y claims checked]**

## Issues

### Critical (must fix before publishing)

These will damage credibility if published as-is.

| # | Article | Claim | Category | Issue | Suggested Fix |
|---|---|---|---|---|---|
| 1 | [article] | "[exact claim text]" | BROKEN URL | URL returns 404 | Find updated URL or remove citation |

### Warnings (should fix)

These are not necessarily wrong but need attention.

| # | Article | Claim | Category | Issue | Suggested Fix |
|---|---|---|---|---|---|
| 1 | [article] | "[exact claim text]" | UNVERIFIABLE | Paywall blocks confirmation | Add note "cited from [source], paywalled" or find alternative source |

### Passed

All other claims that checked out. List count per article, not individual items.

| Article | URLs OK | Stats OK | Company Claims OK | Total Checked |
|---|---|---|---|---|
| [article] | X/Y | X/Y | X/Y | X |
```

---

## Rules

1. **Check every URL.** No exceptions, no sampling. If an article has 15 links, check all 15.
2. **Never assume a statistic is correct because it sounds plausible.** Verify it.
3. **The brand DNA is the source of truth for company claims.** If a claim isn't in the brand DNA and can't be verified externally, flag it.
4. **Be specific in suggested fixes.** Don't just say "fix this" — say "replace with [X]" or "remove this citation and use [alternative source]."
5. **Don't rewrite the article.** Your job is to audit and report, not to edit. The user or writing skill handles fixes.
6. **Flag hallucination patterns explicitly.** If a URL looks like it was generated by an LLM (plausible-looking but nonexistent), say so.
7. **Distinguish between "wrong" and "unverifiable."** A paywalled source is not the same as a fabricated one.
8. **Check arXiv papers by ID.** ArXiv URLs follow a pattern (`arxiv.org/abs/YYMM.NNNNN`). Fetch the abstract page to confirm the paper exists and the cited claim matches.
9. **Time-bound your checks.** If a source is dated (e.g., "2025 report"), confirm the report actually exists for that year. LLMs commonly hallucinate future-dated publications.
10. **Run this skill before any content goes live.** It's cheaper to catch a fabricated stat now than to lose credibility after publishing.

## What This Skill Does NOT Do

- It does not check SEO quality (use `improve-aeo-geo` for that)
- It does not check writing quality or style
- It does not rewrite or fix content — it only reports issues
- It does not evaluate whether the content strategy is good
- It does not check for plagiarism (though obvious copy-paste from sources should be flagged)
