# Reddit Opportunity Research

Finds Reddit pain-point discussions, target subreddits, and search-language patterns based on a brand's Brand DNA. Outputs a ranked opportunity file for helpful promotion, content seeding, and prompt research.

This workflow is intended for Codex usage in this repo. ChatGPT already has native Reddit access in-product, and Claude generally does not.

## Usage

```
/reddit-opportunity-research
```

## Prerequisites

- `brand_dna.md` (required) — run `/research-brand` first
- `keyword_research.md` (optional) — from `/research-keywords`
- `geo_prompt_targets.md` (optional) — from `/geo-content-research`

## Output

`workspace/<customer-name>/reddit_opportunities.md` containing:

- Pain points users discuss on Reddit
- Ranked subreddits and thread patterns to target
- Simulated search queries and AI prompts from Reddit language
- Content ideas to support helpful promotion

## Feeds into

- `geo-content-research` for prompt research
- `write-seo-geo-content` for content creation
- `build-backlinks` for broader community distribution
