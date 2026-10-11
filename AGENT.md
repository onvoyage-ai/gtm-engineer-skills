# GTM Engineer Skills

Skills for go-to-market engineering. Use them on real customers, improve them based on what works.

**This file is the workflow contract.** Read it before running any skill on a customer. Each skill's `SKILL.md` is the detailed procedure; this file is how the pieces connect.

## Workflow

Research → select prompts → **measure baseline** → plan content → write → verify → ship → re-measure on cadence.

1. **`research-brand`** — URL + optional owner interview → `brand_dna.md` (positioning, audience, voice, **Brand Topics aliases**, **Entity Competitors** per product line)
2. **`research-keywords`** — SEO keywords (1-3 words) → `keywords.csv` + long-tail `geo_seeds.csv` handoff
3. **`reddit-opportunity-research`** — Reddit pain points, target subreddits, promotable discussions (Codex-oriented; see Platform Note)
4. **`geo-content-research`** — AI-user prompts → `prompts.csv` (**strictly non-branded**) + `brand_check.csv` (2-4 branded trust queries) + `scout_pool.csv` (rotation reserve)
5. **`geo-monitor`** — run the prompt set against live AI engines (ChatGPT, Gemini, Google AIO, Grok, Claude) via the chrome-devtools MCP → dated XLSX benchmark with embedded evidence, SUMMARY (visibility + RAPP), ENTITY_COMPETITORS sheets. **T0 benchmark runs before any content is written — it is a diagnostic, not a report card.**
6. **`geo-content-planning`** — `plan.csv` page architecture, prioritized by monitor findings (which cells are lost/won)
7. **`write-seo-geo-content`** — product-led SEO/GEO content pages (answer-first, citable passages)
8. **`audit-content`** — verify URLs, statistics, citations, company claims before publishing
9. **`create-geo-charts`** — data visualizations with AI-readable text layers
10. **`build-resource-pages`** — frontend resource pages from audited content
11. **`audit-website-aeo`** — crawl live site, 16 deterministic checks + 6-dimension scored A-F audit
12. **`improve-aeo-geo`** — apply code-level AEO/GEO fixes
13. **`build-backlinks`** — free backlink/mention opportunities (HN, Quora, GitHub, directories) with drafts
14. **loop:** re-run `geo-monitor` on cadence (below), feed deltas back into `geo-content-planning`

## Artifact data flow

| File | Producer | Consumer | Schema |
| --- | --- | --- | --- |
| `brand_dna.md` | research-brand | every downstream skill (aliases, entity competitors, voice) | `research-brand/brand_dna.schema.md` |
| `keywords.csv` | research-keywords | geo-content-planning, content briefs | `research-keywords/keywords.csv.schema.md` |
| `geo_seeds.csv` | research-keywords | geo-content-research (seed mining step) | inline format in both SKILL.md |
| `prompts.csv` | geo-content-research | **geo-monitor (the measured set)** | `geo-content-research/prompts.csv.schema.md` |
| `brand_check.csv` | geo-content-research | geo-monitor (accuracy/sentiment block only) | same schema file |
| `scout_pool.csv` | geo-content-research | geo-monitor (rotation reserve) | same schema file |
| `geo_monitor_<date>.xlsx` | geo-monitor | geo-content-planning, client reporting | workbook structure in `geo-monitor/SKILL.md` |
| `plan.csv` | geo-content-planning | write-seo-geo-content, build-resource-pages | `geo-content-planning/plan.csv.schema.md` |

CSVs are UTF-8 with BOM so editors do not strip commas/accents; the strict-path validators in `evals/csv_contract_utils.mjs` reject non-conforming files.

## GEO measurement laws (non-negotiable)

Derived from "The New Rules of AI Search" (Carter & Lebedev, 2026) ch.13-15 and pilot-validated 2026-09-10:

1. **A prompt containing a tracked-brand alias is confirmation bias, not measurement.** `prompts.csv` is non-branded; the validator rejects alias hits (aliases come from brand_dna "Brand Topics", including nicknames/typos). Branded queries live only in `brand_check.csv`.
2. **Three seed sources for prompts, none optional if available:** (a) first-party data — support transcripts, sales-call notes, chat logs, AI-answer boxes; (b) AI-assisted expansion from keyword/geo_seeds input phrases (template in geo-content-research Step 2A-3, always manually filtered); (c) engine follow-up chips observed during monitor runs — harvest them, they are the next prompts people ask.
3. **Parameter lock before prompt generation** (audience, product line, geo, language, time scope, persona). Prompts generated without locked parameters get flagged, not silently accepted.
4. **Entity competitors ≠ market competitors.** Track who AI engines actually name alongside you (auto-collected in monitor runs into ENTITY_COMPETITORS); re-rank by AI visibility, not revenue. A brand that appears in prompts but is not in any AI answer is a ghost.
5. **RAPP grades the brand, mention-rate does not:** Regular (visibility of non-branded set), Accurate (branded answers free of factual flags), Prominent (first-mention / above-fold share), Positive (sentiment). Accurate+Positive require the branded set — which is why brand_check.csv exists separately and never enters the visibility denominator.
6. **Cadence:** weekly = CORE subset re-run (trend alarm, ~24h/week ops); monthly = full set + 2-3 fresh engine-chip prompts; quarterly = full prompt-set rebuild (prune zero-value rows, ≤20% CORE rotation to avoid chasing model-update noise).
7. **Interview is ask-if-available.** Never block a pipeline on missing owner data: degrade to public proxies tagged `[proxy]` / `[hypothesis]`, request the data again in the next human touchpoint.
8. **No fabricated data anywhere** — stats need sources, seeds need provenance, evidence PNGs need transcripts.

## geo-monitor runtime

- Requires the **chrome-devtools MCP** attached to a logged-in Chrome on remote-debugging port 9222 (launch recipe + profile caveats: see the workspace root's AGENTS.md if present). Engines: ChatGPT, Gemini, Google AI Mode (AIO), Grok, Claude.
- Never `take_snapshot` / never read screenshots on AI chat pages — extract via `evaluate_script` + `innerText` only; screenshot is a last-resort fallback (mark the cell "manual-check"). Login/CAPTCHA is the human's job.
- Engine DOM selectors drift weekly; submit/extract mechanics verified per platform are documented inside `geo-monitor/SKILL.md` — check there before debugging from scratch.
- Workbook evidence images are rendered from saved transcripts (`monitor/transcripts/rowN-engine.txt`), not cropped screenshots (per-site browser zoom makes screenshots unreliable). Reference builders: `build_xlsx_v2.ps1` (lives in the customer `monitor/` dir; Excel COM, rebuild-from-rows.json, `SaveAs` format 51).
- Runs are resumable: the xlsx itself is the state file (empty result cell = pending). Interrupted runs resume by engine preference order, not row order.
- Rate-limit protocol: consecutive failures escalate wait 120s → one retry → `rate_limited` marking; never burn all rows of an engine at once.

## `workspace/` directory

Gitignored. Customer work goes here: `workspace/<customer-name>/`. Store `brand_dna.md`, `keywords.csv`, `prompts.csv`, `brand_check.csv`, `plan.csv` and a `monitor/` subdir per customer (dated outputs — never overwrite a previous run's xlsx). Feed real results back into skill improvements.

## Skill structure

```
<skill-name>/
├── SKILL.md      ← Agent prompt (full procedure)
├── README.md     ← Install instructions
└── examples/     ← Optional
```

Skills are plain markdown prompts (no build step). Offline regression: `npm run test:evals` (CSV contract + crawler regressions).

## Key rules

- SEO keywords: 1-3 words. Longer phrases are blog topics / GEO seeds.
- GEO prompts: full questions (5-15+ words), localized to where the business sells. Not SEO keywords.
- Reddit opportunity output: ranked subreddit + thread patterns, not generic channel advice.
- Skills improve by doing real customer work, not theorizing.

## Platform Note

- `reddit-opportunity-research` is intended for Codex workflows in this repo. ChatGPT already has native Reddit access in-product; Claude generally does not.

## Research Sources

- Crystal Carter & Dmitry Lebedev, *The New Rules of AI Search and The Dawn of Agentic Media* (2026) — ch.13 (measuring AI search), ch.14 (RAPP + multi-layer analysis), ch.15 (prompt-tracking workflow, Part A foundations). Basis of the measurement laws above.
- GEO Paper (KDD 2024): https://arxiv.org/abs/2311.09735
- SE Ranking (Nov 2025): https://seranking.com/blog/how-to-optimize-for-ai-mode/
- Growth Memo (Feb 2026): https://www.growth-memo.com/p/the-science-of-how-ai-pays-attention
- Ahrefs (2025): https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/
- Conductor (Nov 2025): https://www.conductor.com/academy/aeo-geo-benchmarks-report/
- AirOps (2025): https://www.airops.com/report/structuring-content-for-llms
