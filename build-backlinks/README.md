# Build Backlinks

Finds free backlink and brand mention opportunities across Hacker News, Quora, GitHub, directories, and niche communities. Outputs a prioritized action plan with draft responses ready to post.

## Usage

```
/build-backlinks
```

## Prerequisites

- `brand_dna.md` (required) — run `/research-brand` first
- `content_architecture.md` (optional) — from `/geo-content-planning`
- `geo_prompt_targets.md` (optional) — from `/geo-content-research`

## Output

`workspace/<customer-name>/backlink_plan.md` containing:

- Scored list of link/mention opportunities
- Ready-to-post drafts for Reddit, HN, Quora, directories
- Recurring action checklist
- Tracking table

## Feeds into

- Run periodically (monthly) to find new opportunities
- Pairs with `geo-content-research` Phase 6 (Authority Infiltration Plan)
- Results improve `improve-aeo-geo` audit scores over time
