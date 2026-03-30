# GTM Engineer Skills

Skills for go-to-market engineering. Use them on real customers, improve them based on what works.

## Workflow

1. **`research-brand`** — URL → `brand_dna.md`
2. **`research-keywords`** — SEO keywords (1-3 words), validated with Ahrefs/Semrush
3. **`reddit-opportunity-research`** — Reddit pain points, target subreddits, and promotable discussion opportunities from Brand DNA
4. **`geo-content-research`** — GEO prompt targets (Buy/Solve/Learn) for AI citations
5. **`write-seo-geo-content`** — Product-led SEO and GEO content pages
6. **`build-resource-pages`** — Build frontend resource pages from existing content
7. **`audit-content`** — Verify URLs, statistics, citations, and company claims before publishing
8. **`create-geo-charts`** — Data visualizations with AI-readable text layers
9. **`improve-aeo-geo`** — Website AEO/GEO audit and fixes
10. **`build-backlinks`** — Find free backlink/mention opportunities across HN, Quora, GitHub, directories. Outputs actionable plan with ready-to-post drafts

## `workspace/` Directory

Gitignored. Customer work goes here: `workspace/<customer-name>/`. Store `brand_dna.md`, `keyword_research.md`, `geo_prompt_targets.md` per customer. Feed real results back into skill improvements.

## Skill Structure

```
<skill-name>/
├── skill.md      ← Agent prompt
├── README.md     ← Install instructions
└── examples/     ← Optional
```

## Key Rules

- SEO keywords: 1-3 words. Longer phrases are blog topics.
- GEO prompts: full questions (5-15+ words). Not SEO keywords.
- Reddit opportunity output: ranked subreddit + thread patterns, not generic channel advice.
- No fabricated data — every stat needs a source.
- Skills improve by doing real customer work, not theorizing.

## Platform Note

- `reddit-opportunity-research` is intended for Codex workflows in this repo. ChatGPT already has native Reddit access in-product; Claude generally does not.

## Research Sources

- GEO Paper (KDD 2024): https://arxiv.org/abs/2311.09735
- SE Ranking (Nov 2025): https://seranking.com/blog/how-to-optimize-for-ai-mode/
- Growth Memo (Feb 2026): https://www.growth-memo.com/p/the-science-of-how-ai-pays-attention
- Ahrefs (2025): https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/
- Conductor (Nov 2025): https://www.conductor.com/academy/aeo-geo-benchmarks-report/
- AirOps (2025): https://www.airops.com/report/structuring-content-for-llms
