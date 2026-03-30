# Research SEO/GEO Keywords

An agent skill that researches and delivers a prioritized keyword list for SEO and GEO — using web search and AI analysis instead of paid tools like Ahrefs or Semrush.

**No Ahrefs. No Semrush required.**

Uses web search, website crawling, and LLM analysis to find, cluster, and prioritize keywords — including a GEO dimension that traditional tools don't offer. Optionally supercharge research with SERP API scripts for real autocomplete, PAA, and SERP feature data.

---

## Install

Clone the repo, then symlink or copy `research-keywords/` into either `~/.codex/skills/` or `~/.claude/skills/`. See the root [README](../README.md) for installation examples.

## Usage

```
/research-keywords
```

Or:
> "Research keywords for my product"
> "Find SEO and GEO keywords for [brand/URL]"
> "Run keyword research for my [product category]"

The skill is **interactive** — it asks you questions, researches, and delivers a structured keyword file.

---

## The 4-Phase Process

### Phase 1: Brand Intelligence
The skill asks about your product, audience, and competitors. It visits your website and competitor sites to extract language, positioning, and content gaps.

### Phase 2: Keyword Discovery
Researches keywords across 6 methods — no paid tools needed:

| Method | What It Finds |
|---|---|
| Google Autocomplete Mining | Real search suggestions and long-tail variants |
| People Also Ask (PAA) | Question-format keywords AI engines love to answer |
| Reddit & Community Mining | Real user language, pain points, and slang |
| Competitor Content Analysis | Topics competitors cover that you don't |
| Question & Problem Keywords | Problem-aware searches that lead to your product |
| AI Citation Keywords (GEO) | Queries where AI generates answers and cites sources |

### Phase 3: Keyword Analysis & Clustering
Groups keywords into topic clusters, scores each on 3 dimensions:
- **Relevance** to your product (1-5)
- **GEO Opportunity** — will AI answer this and cite sources? (1-5)
- **Business Value** — how close to conversion? (1-5)

Flags quick wins: existing pages to optimize, weak competitor content, AI citation gaps.

### Phase 4: Deliverable
Outputs a structured Markdown file with:
- Prioritized topic clusters with pillar + supporting keywords
- GEO-specific keyword table (highest AI citation potential)
- Quick wins and competitor gaps
- Full raw keyword list for reference
- Content recommendations per cluster

---

## What Makes This Different

| Traditional Keyword Research | This Skill |
|---|---|
| Requires Ahrefs/Semrush ($99-449/mo) | Free — uses web search |
| Focuses on search volume + difficulty | Adds GEO opportunity scoring |
| Outputs a spreadsheet of keywords | Outputs clustered, actionable content plan |
| Ignores AI citation potential | GEO is a first-class dimension |
| Marketer language | Real user language from Reddit/communities |

---

## Works With Other Skills

The keyword deliverable feeds directly into:
- **[write-seo-geo-content](../write-seo-geo-content/)** — write pages for top keyword and prompt clusters
- **[geo-content-research](../geo-content-research/)** — build full AI-ready content for high-GEO keywords
- **[create-geo-charts](../create-geo-charts/)** — create data visualizations for data-driven keywords

---

## SERP Scripts (Optional Power Tools)

The `scripts/` directory contains Node.js tools that pull real Google data to supercharge keyword research. These are optional — the skill works without them using Claude's web search, but they provide higher-volume, more precise data.

### `keyword-explorer.mjs` — Keyword Discovery

Pulls real Google autocomplete suggestions, People Also Ask questions, related searches, and detects SERP features (AI Overviews, Featured Snippets).

```bash
# Free mode — no API key, autocomplete only
node scripts/keyword-explorer.mjs --seeds "physical AI, DePAI" --free

# Full mode with SerpAPI (free tier: 100 searches/month at serpapi.com)
SERPAPI_KEY=xxx node scripts/keyword-explorer.mjs \
  --seeds "physical AI, DePAI, decentralized robotics" \
  --depth deep \
  --out keywords.json

# Quick scan for a single seed
node scripts/keyword-explorer.mjs -s "machine economy" --free -d quick
```

**Options:**
| Flag | Description | Default |
|---|---|---|
| `--seeds, -s` | Comma-separated seed keywords (required) | — |
| `--free` | Free mode: Google suggestions, no API key | auto if no key |
| `--depth, -d` | `quick` / `normal` / `deep` | `normal` |
| `--out, -o` | Output JSON file path | auto-generated |
| `--gl` | Country code | `us` |
| `--hl` | Language code | `en` |

**What it outputs:**
- All discovered keywords with source tags (autocomplete, PAA, related_search)
- People Also Ask questions with snippets and sources
- SERP feature detection per query (AI Overview, Featured Snippet, etc.)
- Queries where AI Overviews appear (= high GEO opportunity)

### `serp-analyzer.mjs` — SERP Competition Analysis

Takes a keyword list and checks who currently ranks, what SERP features appear, and where content gaps exist.

```bash
# Analyze keywords from explorer output
SERPAPI_KEY=xxx node scripts/serp-analyzer.mjs \
  --input keywords.json \
  --top 20 \
  --track "axisrobotics.ai,bittensor.com"

# Analyze specific keywords
SERPAPI_KEY=xxx node scripts/serp-analyzer.mjs \
  --keywords "what is DePAI, physical AI companies, best AI robotics crypto" \
  --track "axisrobotics.ai"
```

**Options:**
| Flag | Description | Default |
|---|---|---|
| `--input, -i` | Path to keyword-explorer JSON output | — |
| `--keywords, -k` | Comma-separated keywords to analyze | — |
| `--top, -t` | How many keywords from input file | `10` |
| `--track` | Comma-separated domains to track | — |
| `--out, -o` | Output JSON file path | auto-generated |

**What it outputs:**
- Difficulty estimate per keyword (easy / medium / hard)
- SERP features present (AI Overview, Featured Snippet, PAA, Knowledge Graph, etc.)
- Which sources AI Overviews currently cite
- Tracked domain presence/absence (find your content gaps)
- Most frequent ranking domains (identify real competitors)
- All PAA questions (content ideas)

### Recommended Workflow

```
1. Run keyword-explorer with your seed keywords
   → Get raw keyword list + PAA questions

2. Feed output into serp-analyzer for top priority keywords
   → Get competition data + SERP feature opportunities

3. Run the /research-keywords skill with both outputs
   → Get clustered, scored, actionable keyword plan
```

### Setup

```bash
# No dependencies needed — pure Node.js (v18+), zero npm install
# Just need a SerpAPI key for full features (free at serpapi.com)
export SERPAPI_KEY=your_key_here
```

---

## Example Output

```
## Priority Keyword Clusters

### Cluster 1: Best AI Writing Tools — Priority: 14/15
Pillar Keyword: best AI writing tools 2026
Intent: Commercial Investigation
GEO Opportunity: 5/5 — AI Overviews appear, comparison format
Business Value: 5/5 — direct purchase intent
Relevance: 4/5

| Keyword | Intent | GEO Opp | Notes |
|---|---|---|---|
| best AI writing tools 2026 | Commercial | High | Pillar |
| AI writing tool comparison | Commercial | High | Comparison table content |
| is jasper AI worth it | Trust | High | PAA — address in FAQ |
| AI content writer for blogs | Commercial | Medium | Use-case variant |
```
