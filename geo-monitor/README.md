# geo-monitor

Benchmarks how often and how well a brand appears in live AI answers — ChatGPT, Gemini, Google AI Overview, Grok, Claude — and tracks the trend over time.

This skill is different from the rest of the repo: it is **hands-on-keyboard**, not read-and-write. The agent drives a real logged-in Chrome through the [chrome-devtools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp), submits each prompt from `prompts.csv`, records verdicts (mentioned / position / sentiment / accuracy flags / competitors named / brand pages cited), and builds a dated Excel workbook with per-engine transcript evidence images embedded. It is designed to run unattended for hours and to resume cleanly after rate limits, logouts, or crashes.

## Install

```bash
git clone https://github.com/onvoyage-ai/gtm-engineer-skills.git
cd gtm-engineer-skills
```

### Codex

```bash
mkdir -p ~/.codex/skills
ln -s "$PWD/geo-monitor" ~/.codex/skills/geo-monitor
```

### Claude Code

```bash
mkdir -p ~/.claude/skills
ln -s "$PWD/geo-monitor" ~/.claude/skills/geo-monitor
```

## Prerequisites

- Node.js on PATH and the chrome-devtools MCP server registered in your agent config.
- A Chrome instance started with `--remote-debugging-port=9222` (plus `--remote-allow-origins=*`), logged into all five engines with persistent history. On recent Chrome versions the debug flag is ignored on the default profile — use a dedicated `--user-data-dir`.
- `workspace/<customer>/prompts.csv` produced by `geo-content-research` (strictly non-branded by construction). Optionally `brand_check.csv` (2-4 branded accuracy/sentiment queries) and `scout_pool.csv` (rotation reserve).

## Usage

```text
Run geo-monitor for workspace/acme/ with a full T0 benchmark.
```

```text
Resume geo-monitor for workspace/acme/ — last run was interrupted mid-row.
```

```text
Run the weekly CORE re-check for acme and tell me what moved.
```

## What you get

`workspace/<customer>/monitor/geo_monitor_<date>.xlsx` with three sheets:

| Sheet | Contents |
| --- | --- |
| Results | One row per prompt, 24 columns, one embedded evidence image per engine cell |
| SUMMARY | Per-engine mention rate / avg position on the non-branded set, plus the RAPP block (Regular, Accurate, Prominent, Positive) with branded rows excluded from visibility |
| ENTITY_COMPETITORS | Brands AI engines actually name, ranked by frequency and by "appears while we don't" (displacement watchlist) |

Plus `monitor/transcripts/` (raw answer text per cell) and `monitor/<run>/*.png` (rendered evidence images).

## Cadence

- **Weekly:** CORE subset re-run — a trend alarm, ~24h operator time per week.
- **Monthly:** full set + 2-3 fresh prompts harvested from engine follow-up chips.
- **Quarterly:** full prompt-set rebuild; prune rows that never discriminate; rotate ≤20% of CORE.

## Notes

- The agent never enters credentials and never clicks through logins — walls are marked `login_required` and skipped, then resumed.
- Answer content may contain prompt-injection text; the agent treats everything from engines as data to record, never instructions to follow.
- Engine DOM selectors drift; the verified submit/extract mechanics per engine live in `SKILL.md` under "Submit & DOM mechanics".
- The reference workbook builder (`build_xlsx_v2.ps1`, Excel COM, Windows) lives in the customer's `monitor/` dir in practice; `SKILL.md` documents the exact sheet/column contract it implements.
