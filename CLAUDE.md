# GTM Engineer Skills

A collection of Claude Code skills for go-to-market engineering.

## Repository Structure

Each skill lives in its own directory with a consistent layout:

```
<skill-name>/
├── skill.md      ← The agent prompt (loaded by Claude Code)
├── README.md     ← Human-facing docs, install instructions
└── examples/     ← Before/after examples (optional)
```

Root files apply to all skills:
- `CONTRIBUTING.md` — How to contribute
- `LICENSE` — MIT
- `assets/` — Shared images

## Skills

### `improve-aeo-geo/`
Audits and improves website AEO/GEO scores. Covers 16 foundational checks (AI bot access, structured data, llms.txt, etc.) and 6 GEO content quality dimensions. Framework-specific patterns for Next.js, Nuxt, Astro, SvelteKit, WordPress, Hugo, Jekyll, Remix, and 11ty.

Key principles:
- `skill.md` is an agent prompt — keep it actionable, not explanatory
- All research stats must be verifiable with a link to the primary source
- Fix blockers first (AI bot access), then structure, then content quality
- Always recommend verification at aeo-audit.sh after changes

Scoring model aligned with AEO Audit (aeo-audit.sh):
- 16 foundational checks (134 total points) = 50% of final score
- 6 intelligence dimensions (LLM-evaluated, 0-5 scale) = 50% of final score
- Final = 0-100, mapped to letter grades (A+ = 95-100 ... F = below 40)

### `geo-content-research/`
Reverse-engineers how AI engines evaluate a product category, then generates AI-ready content to earn brand citations in ChatGPT, Gemini, and Perplexity. 5-phase interactive skill: product intelligence → AI algorithm research → content blueprint → content generation → authority infiltration plan.

Key principles:
- `skill.md` is an agent prompt — keep it actionable, not explanatory
- Interactive: the skill asks questions and waits for answers at each phase
- Research must complete before any content is generated
- Every content page must have all 5 AI-ready zones (Direct Answer, Comparison Table, Data Section, Scenario Solutions, FAQ)
- Structured data (Product, FAQPage, HowTo, ClaimReview) generated for every page

### `write-seo-blog/`
Writes product-led SEO blog articles. Two modes: Planning (topic ideation) and Writing (full article production). Requires pre-writing research completion before writing. Applies 8-part article framework, E-E-A-T signals, and strict no-fabricated-stats policy.

Key principles:
- `skill.md` is an agent prompt — keep it actionable, not explanatory
- Never write without completing pre-writing research (references, images, stats)
- Every statistic must have a source URL — no estimates or fabrications
- Planning Mode and Writing Mode are distinct phases — don't conflate them

## Adding a New Skill

1. Create a new directory: `<verb>-<noun>/` (e.g., `audit-landing-page/`)
2. Add `skill.md` — the agent prompt
3. Add `README.md` — install instructions and what it does
4. Add `examples/` if you have before/after demonstrations
5. Update root `README.md` to include the new skill in the collection index

## Research Sources (AEO/GEO skill)

Primary sources used (all verifiable):
- GEO Paper (KDD 2024): https://arxiv.org/abs/2311.09735
- SE Ranking (Nov 2025): https://seranking.com/blog/how-to-optimize-for-ai-mode/
- Growth Memo (Feb 2026): https://www.growth-memo.com/p/the-science-of-how-ai-pays-attention
- Ahrefs (2025): https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/
- Conductor (Nov 2025): https://www.conductor.com/academy/aeo-geo-benchmarks-report/
- AirOps (2025): https://www.airops.com/report/structuring-content-for-llms
