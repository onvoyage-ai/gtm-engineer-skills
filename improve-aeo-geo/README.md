# Improve Website AEO/GEO

[![AEO Audit](../assets/aeo-audit-screenshot.jpeg)](https://aeo-audit.sh/)

The web is no longer read only by humans. AI agents — ChatGPT, Claude, Perplexity, Google AI Overviews — are now how millions of people discover information. These agents don't browse. They extract, parse, and decide in milliseconds whether your content is worth citing.

**If your site isn't optimized for AI, you're invisible to a growing share of your audience.**

This is a [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill that audits your website's codebase and makes concrete improvements to boost your AEO (AI Engine Optimization) and GEO (Generative Engine Optimization) scores.

**Check your score at [aeo-audit.sh](https://aeo-audit.sh/)** — then use this skill to improve it.

---

## Install

```bash
claude skill add --from https://github.com/onvoyage-ai/gtm-engineer-skills/improve-aeo-geo
```

Or manually copy `skill.md` into your project's `.claude/skills/` directory.

## Usage

Once installed, invoke the skill in Claude Code:

```
/improve-aeo-geo
```

Or reference it in conversation:

> "Use the AEO skill to optimize this site"
> "Run the AEO/GEO audit on my codebase"

The skill will:
1. Detect your framework (Next.js, Nuxt, Astro, SvelteKit, WordPress, Hugo, Jekyll, and more)
2. Audit your code against 16 foundational checks and 6 content quality dimensions
3. Make targeted code changes in priority order
4. Recommend verifying your score at [aeo-audit.sh](https://aeo-audit.sh/)

---

## What It Checks

### Foundational (16 checks, 134 points)

| Check | Points | Pass Criteria |
|---|---|---|
| AI bot access (robots.txt) | 12 | 9 AI crawlers not blocked |
| Text depth | 12 | 250+ words per page |
| Page title | 10 | 10+ characters |
| Meta description | 10 | 50+ characters |
| Internal linking | 10 | 5+ internal links per page |
| Indexability | 10 | No `noindex` on public pages |
| llms.txt | 10 | Valid file at `/.well-known/llms.txt` |
| JSON-LD structured data | 8 | At least 1 JSON-LD block per page |
| Schema types | 8 | Recognized `@type` values |
| Canonical URL | 8 | `rel="canonical"` present |
| Single H1 | 8 | Exactly 1 `<h1>` per page |
| Open Graph | 8 | `og:title` + `og:description` |
| Image alt text | 8 | 80%+ images have `alt` |
| RSS feed | 8 | Discoverable RSS/Atom feed |
| Heading hierarchy | 6 | H1 → H2 → H3, no skips |
| AI meta tags | 6 | No `nosnippet`/`noai`/`noimageai` |

### GEO Content Quality (6 dimensions)

| Dimension | What It Measures |
|---|---|
| Answer Readiness | Direct answers in opening paragraphs |
| Quotability | Self-contained, extractable passages |
| Evidence Density | Statistics, sources, citations inline |
| Content Depth | Substantive, multi-faceted coverage |
| Freshness | Publication dates, update signals |
| Structural Clarity | Semantic HTML, clean heading outline |

---

## Why This Matters — The Research

All claims are from peer-reviewed academic research or large-scale industry studies:

| Finding | Source |
|---|---|
| Adding quotations = **+41% AI visibility** | [GEO Paper, KDD 2024](https://arxiv.org/abs/2311.09735) — Princeton, Georgia Tech, IIT Delhi, Allen AI |
| Adding statistics = **+33% AI visibility** | Same peer-reviewed paper |
| Citing sources = **+28% AI visibility** | Same paper; up to **+115% for smaller sites** |
| **44.2%** of ChatGPT citations come from first 30% of content | [Growth Memo, 2026](https://www.growth-memo.com/p/the-science-of-how-ai-pays-attention) — 1.2M AI answers analyzed |
| Articles 2,900+ words = **5.1 citations** vs. 3.2 for <800 words | [SE Ranking, 2025](https://seranking.com/blog/how-to-optimize-for-ai-mode/) — 2.3M pages studied |
| Pages with FAQ sections = **4.9 citations** vs. 4.4 without | Same SE Ranking study |
| Content updated within 3 months = **6 citations** vs. 3.9 for 2+ years | Same SE Ranking study |
| AI cites content **25.7% fresher** than traditional search | [Ahrefs, 2025](https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/) — 17M citations |
| ChatGPT drives **87.4%** of AI referral traffic | [Conductor, 2025](https://www.conductor.com/academy/aeo-geo-benchmarks-report/) — 13.7K domains |

---

## Supported Frameworks

The skill provides framework-specific code patterns for:

- **Next.js** (App Router) — metadata exports, JSON-LD, robots.ts, sitemap.ts
- **Nuxt 3** — useSeoMeta, nuxt-schema-org
- **SvelteKit** — svelte:head, JSON-LD injection
- **Astro** — layout props, @astrojs/sitemap
- **Remix** — meta function, link tags
- **WordPress** — functions.php, Yoast/Rank Math integration
- **Hugo** — partials, built-in RSS, template variables
- **Jekyll** — jekyll-seo-tag, jekyll-feed gems
- **11ty** — Nunjucks templates, eleventy plugins
- **Plain HTML** — direct tag implementation

---

## Examples

- [Next.js Blog: 42 → 87/100](examples/nextjs-blog-before-after.md)
- [WordPress Business Site: 31 → 82/100](examples/wordpress-business-before-after.md)

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on adding new checks, frameworks, or research.

## License

MIT — see [LICENSE](../LICENSE).
