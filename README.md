# GTM Engineer Skills

A collection of Codex/Claude Code style skills for go-to-market engineering — research, content, SEO, GEO, and frontend implementation.

<p align="center">
  <img src="assets/logo.svg" alt="GTM Engineer Skills" width="200" />
</p>

---

## Workflow

Skills are designed to run in sequence. Each step produces files that feed into the next.

```
              ┌───────────────────────────┐
              │       research-brand      │
              │       URL → brand_dna     │
              └─────────────┬─────────────┘
                            │
      ┌─────────────────────┼──────────────────────┐
      ▼                     ▼                      ▼
┌───────────────────────┐ ┌──────────────────────────────┐ ┌───────────────────────┐
│   research-keywords   │ │ reddit-opportunity-research │ │  geo-content-research │
│  → keyword_research   │ │ → reddit_opportunities      │ │ → geo_prompt_targets  │
└───────────┬───────────┘ └──────────────┬───────────────┘ └───────────┬───────────┘
            └──────────────┬─────────────┴──────────────┬──────────────┘
                           ▼                            ▼
              ┌───────────────────────────┐   ┌───────────────────────┐
              │   geo-content-planning    │   │    build-backlinks    │
              │  → content_architecture   │   │   → backlink_plan     │
              └─────────────┬─────────────┘   └───────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│ write-seo-geo-content │   │  create-geo-charts    │
│  → markdown articles  │   │  → SVG + data tables  │
└───────────┬───────────┘   └───────────┬───────────┘
            │                           │
            └─────────────┬─────────────┘
                          ▼
              ┌───────────────────────────┐
              │      audit-content        │
              │      verify sources       │
              └─────────────┬─────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│ build-resource-pages  │   │   improve-aeo-geo     │
│  content → frontend   │   │  website code fixes   │
└───────────────────────┘   └───────────────────────┘
```

### Step by step

| Step | Skill | Input | Output |
|------|-------|-------|--------|
| 1 | **`research-brand`** | Company URL | `brand_dna.md` — positioning, audience, competitors, voice |
| 2a | **`research-keywords`** | Brand DNA + product category | `keyword_research.md` — prioritized keywords by intent |
| 2b | **`reddit-opportunity-research`** | Brand DNA + optional keyword/GEO files | `reddit_opportunities.md` — ranked subreddit and thread opportunities |
| 2c | **`geo-content-research`** | Brand DNA + product category | `geo_prompt_targets.md` — AI prompts by business-value tier |
| 3 | **`geo-content-planning`** | Brand DNA + keywords + GEO prompts + Reddit signals | `content_architecture.md` — page plan with types, URLs, priority |
| 4a | **`write-seo-geo-content`** | Content architecture + research | Markdown articles with frontmatter |
| 4b | **`create-geo-charts`** | Data from articles | SVG charts + HTML tables + JSON-LD |
| 5 | **`audit-content`** | Articles + Brand DNA | Audit reports — verified URLs, stats, claims |
| 6a | **`build-resource-pages`** | Audited content + client codebase | Frontend resource center pages |
| 6b | **`improve-aeo-geo`** | Client website codebase | Code fixes for AI discoverability |

Steps marked **a/b/c** can run in parallel.

## Platform Note

The `reddit-opportunity-research` skill is Codex-oriented in this repo. ChatGPT already has native Reddit access in its product experience, and Claude generally does not expose the same Reddit access pattern, so this workflow is documented here for Codex use.

---

## Skills

### [Research Brand DNA](research-brand/)

Researches a company from its URL and produces a Brand DNA file covering positioning, audience, competitors, voice, and messaging.

```bash
mkdir -p ~/.claude/skills/research-brand
curl -o ~/.claude/skills/research-brand/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/research-brand/skill.md
```

### [Research SEO/GEO Keywords](research-keywords/)

Finds high-value SEO and GEO keywords using web search, AI analysis, and optionally paid tools like Ahrefs or Semrush.

```bash
mkdir -p ~/.claude/skills/research-keywords
curl -o ~/.claude/skills/research-keywords/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/research-keywords/skill.md
```

### [Reddit Opportunity Research](reddit-opportunity-research/)

Finds Reddit pain-point discussions, target subreddits, and search-language patterns based on Brand DNA. Produces a ranked opportunity list for helpful promotion, content seeding, and prompt research.

```bash
mkdir -p ~/.claude/skills/reddit-opportunity-research
curl -o ~/.claude/skills/reddit-opportunity-research/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/reddit-opportunity-research/skill.md
```

### [GEO Content Research](geo-content-research/)

Researches what prompts people ask AI engines about a product category. Produces a GEO prompt target table with business-value tiers (Buy/Solve/Learn).

```bash
mkdir -p ~/.claude/skills/geo-content-research
curl -o ~/.claude/skills/geo-content-research/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/geo-content-research/skill.md
```

### [GEO Content Planning](geo-content-planning/)

Reads brand DNA, keyword research, and GEO prompt targets, then produces a content architecture — what pages to create, their types, URLs, and priority.

```bash
mkdir -p ~/.claude/skills/geo-content-planning
curl -o ~/.claude/skills/geo-content-planning/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/geo-content-planning/skill.md
```

### [Write SEO + GEO Content](write-seo-geo-content/)

Writes product-led content pages optimized for search engines and AI engine citations. Research-first methodology with page-type frameworks and no fabricated stats.

```bash
mkdir -p ~/.claude/skills/write-seo-geo-content
curl -o ~/.claude/skills/write-seo-geo-content/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/write-seo-geo-content/skill.md
```

### [Create GEO/SEO Charts](create-geo-charts/)

Creates data visualizations that AI engines can parse, quote, and cite. Every chart includes a text summary, HTML data table, and JSON-LD.

```bash
mkdir -p ~/.claude/skills/create-geo-charts
curl -o ~/.claude/skills/create-geo-charts/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/create-geo-charts/skill.md
```

### [Audit Content](audit-content/)

Verifies truthfulness, accuracy, and link integrity of content before publishing. Catches fabricated statistics, dead URLs, and misattributed sources.

```bash
mkdir -p ~/.claude/skills/audit-content
curl -o ~/.claude/skills/audit-content/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/audit-content/skill.md
```

### [Build Resource Pages](build-resource-pages/)

Takes existing content markdown files and builds production-ready resource center pages on client websites using their existing tech stack and design system.

```bash
mkdir -p ~/.claude/skills/build-resource-pages
curl -o ~/.claude/skills/build-resource-pages/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/build-resource-pages/skill.md
```

### [Improve Website AEO/GEO](improve-aeo-geo/)

Audits a website codebase and makes code changes so AI engines can better discover, parse, quote, and cite the site.

```bash
mkdir -p ~/.claude/skills/improve-aeo-geo
curl -o ~/.claude/skills/improve-aeo-geo/skill.md \
  https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/improve-aeo-geo/skill.md
```

**Check your score first**: [aeo-audit.sh](https://aeo-audit.sh/)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute new skills, improve existing ones, or add examples.

## License

MIT — see [LICENSE](LICENSE).
