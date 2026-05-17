# Audit Website AEO/GEO

An agent skill that audits a **live website** for AI-engine discoverability — the way ChatGPT, Claude, Perplexity, and Google AI Overviews actually see it.

It crawls the site, runs **16 deterministic checks**, then evaluates **6 content-quality dimensions** and produces a single A-F score with prioritized fixes.

This skill *diagnoses*. To then fix a codebase, hand the report to [`improve-aeo-geo`](../improve-aeo-geo/).

---

## Install

Clone the repo, then symlink or copy `audit-website-aeo/` into `~/.codex/skills/` or `~/.claude/skills/`. See the root [README](../README.md) for examples.

Requires **Node 18+** for the crawler script (uses the built-in `fetch`). No `npm install` — the script is zero-dependency.

## Usage

```
/audit-website-aeo
```

Or:
> "Audit my website for AEO"
> "Check if AI engines can cite https://example.com"
> "Run an AEO/GEO audit on [URL]"

The skill asks for a URL and crawl depth, runs the audit, and writes a report.

---

## How it works

1. **Crawl** — Discovers pages via `sitemap.xml`, `robots.txt`, and internal links (up to 30 pages), respecting `robots.txt`.
2. **Deterministic audit** — A Node script runs 16 binary checks per page and aggregates site-wide (a check passes when 80%+ of pages pass it).
3. **Intelligence evaluation** — The agent reads the richest pages and scores 6 dimensions 0-5 using a research-backed rubric.
4. **Scoring** — `Final = 50% foundational + 50% intelligence`, mapped to an A-F grade.
5. **Report** — A Markdown report with the score, failed checks, dimension findings, prioritized fixes, and weakest pages.

### The 16 deterministic checks

Title · meta description · canonical URL · single H1 · structured data (JSON-LD) · recognized schema types · Open Graph · internal linking · image alt coverage · text depth · indexability · AI-accessible meta tags · heading hierarchy · `llms.txt` · AI-bot access in `robots.txt` · RSS/Atom feed.

### The 6 intelligence dimensions

| Dimension | Question it answers |
|---|---|
| Answer Readiness | Can an agent find a direct answer in the opening paragraphs? |
| Quotability | Can a clean 40-60 word passage be extracted to quote? |
| Evidence Density | Are there statistics, data points, and named sources? |
| Content Depth | Is there enough substance to thoroughly answer questions? |
| Freshness | Does the content appear current enough to cite? |
| Structural Clarity | Does the HTML parse cleanly into readable text? |

---

## The crawler script

`scripts/aeo-audit.mjs` is a standalone, zero-dependency Node crawler and checker. The skill runs it for you, but you can also run it directly:

```bash
node scripts/aeo-audit.mjs https://example.com --max-pages=20 --out=aeo-audit.json
```

| Flag | Default | Description |
|---|---|---|
| `--max-pages=N` | `10` | Pages to crawl (max 30) |
| `--out=PATH` | `aeo-audit-report.json` | JSON report path |
| `--no-out` | — | Skip writing the JSON file |
| `--json` | — | Print full JSON to stdout instead of a summary |

It prints a human-readable summary and writes a JSON report containing the foundational score, all 16 checks, prioritized fixes, weakest pages, and `pagesForReview` (the pages the agent reads for the intelligence evaluation).

> **Parsing note:** the script parses HTML with regex/string ops, not a full DOM, so it has no dependencies but is slightly less precise than a browser. Checks measure presence and structure, which tolerates this well.

---

## Where it fits in the workflow

```
audit-website-aeo   →   improve-aeo-geo   →   audit-website-aeo (re-run)
   diagnose              fix the codebase        measure the delta
```

Run it before `improve-aeo-geo` to get a baseline, and again afterward to confirm the score improved.

## License

MIT — see the root [LICENSE](../LICENSE).
