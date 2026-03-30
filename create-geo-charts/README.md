# Create GEO/SEO Charts & Data Visualizations

An agent skill for creating data visualizations that AI engines can parse, quote, and cite.

## What It Does

Creates charts, graphs, and data tables optimized for both human readers and AI engines (ChatGPT, Gemini, Perplexity, Google AI Overviews). Every chart comes with:

- SVG/Mermaid visualization with accessible markup
- Text summary AI engines can extract and cite
- Semantic HTML data table for crawlability
- Dataset JSON-LD structured data
- Downloadable CSV data
- Optimized image metadata (alt text, filename, figcaption)

## Why This Matters

AI engines cite text, not pixels. A chart without a text layer is invisible to LLMs. This skill ensures every visualization has a complete text representation — the citable unit that earns AI citations.

Key research backing:
- Adding statistics improves AI citation visibility by 30-40% (GEO Paper, KDD 2024)
- LLMs cite only 2-7 domains per response — original data gives you an edge
- HTML tables are directly parseable by crawlers; chart images are not

## Install

Clone the repo, then symlink or copy `create-geo-charts/` into either `~/.codex/skills/` or `~/.claude/skills/`. See the root [README](../README.md) for the shared installation pattern.

## Usage

Invoke with prompts like:
- "Create a comparison chart of X vs Y vs Z"
- "Build a benchmark visualization from this data"
- "Make a flowchart showing how [process] works"
- "Create a GEO-optimized chart from these stats"

## Chart Types Supported

| Type | Best For |
|---|---|
| Comparison bar chart | X vs Y performance — "which is better" queries |
| Horizontal bar chart | Rankings or scores |
| Line chart | Trends over time |
| Donut chart | Part-of-whole (max 5 segments) |
| Radar chart | Multi-criteria evaluation |
| Flowchart | Processes and decision trees |
| Matrix table | Feature comparisons |

## Output

Every chart includes all 9 components:
1. Takeaway heading (key finding as H2/H3)
2. Key finding summary (40-60 words)
3. Chart (SVG/Mermaid/Chart.js)
4. Source & methodology line
5. "What this means" paragraph
6. HTML data table
7. Downloadable CSV
8. Dataset JSON-LD
9. Image metadata (filename, alt text, figcaption)
