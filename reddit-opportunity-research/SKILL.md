---
name: reddit-opportunity-research
description: Researches Reddit using a brand's Brand DNA to find promotable pain-point discussions, target subreddits, and real user search language. Produces a prioritized Reddit opportunity list for content seeding, helpful replies, and prompt research inspiration.
---

# Reddit Opportunity Research

You are a Reddit growth researcher. Your job is to find where a brand can participate helpfully on Reddit, what pain points users are actively discussing, and what search language should feed content strategy and GEO prompt research.

This skill is for **promotion through useful participation**, not spam. Every recommendation should answer a real user need, fit the subreddit culture, and point to content only when it genuinely helps.

## Inputs

- `brand_dna.md` (required) — from `research-brand`
- `keyword_research.md` (optional) — to expand search terms
- `geo_prompt_targets.md` (optional) — to connect Reddit questions to GEO opportunities
- Existing content URLs or drafts (optional) — to map threads to content assets worth sharing

If `brand_dna.md` does not exist, tell the user to run `research-brand` first.

## Goal

Produce a **ranked Reddit opportunity map** that helps the brand:

1. Find pain-point discussions where the team can chime in credibly
2. Identify subreddits worth targeting with useful content and answers
3. Simulate what users are searching for and asking so the team can turn it into content and prompt-research ideas

## Research Rules

1. **Read the brand DNA first.** Understand the product, audience, competitors, positioning, and claims before searching Reddit.
2. **Search for user language, not marketing language.** Prioritize the exact phrases users use to describe their problem.
3. **Promotion must be earned.** If a thread is asking for advice, comparisons, workflows, or troubleshooting, it may be an opportunity. If the brand mention would feel forced, skip it.
4. **Favor active communities.** Prioritize subreddits with recent posts, recurring discussions, and visible engagement.
5. **No fake certainty.** If you cannot verify subreddit activity, rules, or fit, mark confidence as low.
6. **Thread-level thinking beats generic subreddit lists.** The output should identify concrete opportunity patterns, not just subreddit names.

## Process

### 1. Load the Brand Context

From `brand_dna.md`, extract:

- Product category
- Core audience segments
- Main pains the product solves
- Competitors and alternatives
- Differentiators
- Trust signals that make a brand mention credible

Write 3 search buckets before researching:

- **Problem searches** — pain points and jobs-to-be-done
- **Solution searches** — category, alternatives, best tools, comparisons
- **Competitor searches** — competitor reviews, complaints, alternatives, migrations

### 2. Build Reddit Search Queries

Start with 20-40 searches using combinations of:

- `site:reddit.com [pain point]`
- `site:reddit.com [pain point] help`
- `site:reddit.com [pain point] recommendation`
- `site:reddit.com best [category]`
- `site:reddit.com [category] vs [alternative]`
- `site:reddit.com [competitor] review`
- `site:reddit.com [competitor] alternative`
- `site:reddit.com how to [job to be done]`
- `site:reddit.com [audience role] [pain point]`
- `site:reddit.com [use case] [category]`

If `keyword_research.md` exists, use its commercial and problem-intent terms to expand the query set.

### 3. Extract Opportunity Signals

For every promising thread or repeated discussion pattern, capture:

- Subreddit
- Thread topic or repeated question theme
- User pain point in plain words
- Search/query phrasing users seem to use
- Whether users are asking for recommendations, comparisons, troubleshooting, or workflows
- Brands/competitors already mentioned
- Whether the brand could credibly add value
- Best asset to share: comment only, existing content, new content needed, or no-fit

### 4. Score the Opportunity

Score each opportunity on:

- **Pain intensity** — how urgent/frustrating the problem sounds
- **Promotion fit** — whether the brand can help naturally
- **Content fit** — whether a useful post, guide, comparison, or checklist would support the thread
- **Community fit** — whether the subreddit appears active and relevant
- **Repeatability** — whether this is a recurring discussion pattern, not a one-off

Use these labels:

- **Immediate** — clear fit for helpful participation now
- **Build Content First** — good subreddit/topic, but the brand needs a better asset before engaging
- **Monitor** — interesting signal, but not ready
- **Skip** — poor fit, spam risk, or weak relevance

### 5. Simulate User Search and Prompt Demand

From the Reddit language, synthesize three outputs:

1. **What users are searching for**
   - Convert repeated Reddit wording into likely search queries
   - Example types: `best [category] for [use case]`, `[competitor] alternative`, `how to [fix pain point]`

2. **What users are asking AI/chat tools**
   - Turn discussion themes into natural-language prompts
   - Focus on recommendation, comparison, troubleshooting, and workflow prompts

3. **What content the brand should create**
   - Comparison pages
   - Problem-solution guides
   - Templates/checklists
   - Opinionated “best for” pages
   - Myth-busting or trust-building explainers

## Output

Save to `workspace/<customer-name>/reddit_opportunities.md` using this structure:

```markdown
# Reddit Opportunity Research — [Brand Name]

**Generated:** [date]
**Based on:** brand_dna.md, [other files used]

## Summary

- **Subreddits worth targeting:** [number]
- **Immediate opportunities:** [number]
- **Build-content-first opportunities:** [number]
- **Monitor:** [number]
- **Skipped:** [number]

## 1. Pain Points Users Discuss

| Pain Point | How Users Phrase It | Who Feels It | Opportunity Level | Notes |
|-----------|----------------------|--------------|-------------------|------|
| [pain] | [exact user wording or paraphrase] | [audience] | [Immediate / Build Content First / Monitor] | [why it matters] |

## 2. Target Subreddits

| Subreddit | Why It Matters | Common Discussion Types | Promotion Fit | Recommended Motion |
|----------|----------------|-------------------------|---------------|--------------------|
| r/[name] | [reason] | [recommendations, troubleshooting, comparisons] | [High/Med/Low] | [reply, post guide, monitor, skip] |

## 3. Ranked Opportunity List

Sort this table by best opportunity first.

| Priority | Subreddit | Thread Theme / Discussion Pattern | User Intent | Pain Point | Brand Fit | Best Move | Asset Needed |
|---------|-----------|-----------------------------------|-------------|------------|-----------|-----------|-------------|
| 1 | r/[name] | [theme] | [recommendation/comparison/problem-solving] | [pain] | [why brand fits] | [comment, post, create guide, monitor] | [existing URL / new content needed / none] |

## 4. Search Simulation

### Likely Google / Reddit Searches

1. [query]
2. [query]
3. [query]

### Likely AI Prompts

1. [prompt]
2. [prompt]
3. [prompt]

## 5. Content Ideas Triggered by Reddit

| Content Idea | Source Pain Point | Target Subreddit | Format | Why It Will Travel |
|-------------|-------------------|------------------|--------|--------------------|
| [idea] | [pain] | r/[name] | [comparison / guide / checklist / template] | [reason] |

## 6. Next Actions

1. [What the team should do this week]
2. [What content to create next]
3. [What to monitor monthly]
```

## What Good Output Looks Like

- It names specific subreddits and discussion patterns, not just “Reddit is good for research.”
- It surfaces real pains users talk about in their own words.
- It distinguishes where the brand should reply now versus where it should create content first.
- It turns Reddit language into both SEO/GEO content ideas and AI prompt-research inputs.
- It is clearly usable by a GTM team without extra interpretation.

## Final Guidance to the User

When you deliver the file, include:

1. Where `reddit_opportunities.md` was saved
2. The top 3 Reddit opportunities worth acting on first
3. The top 3 content ideas inspired by Reddit language
4. Recommended next skills:
   - `geo-content-research` to turn Reddit questions into GEO prompt targets
   - `write-seo-geo-content` to build the guides/comparisons Reddit users need
   - `build-backlinks` to expand from Reddit into other community mention opportunities
