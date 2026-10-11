# geo-harvester (spike v0.2)

Scripted capture of AI answers over CDP into the logged-in pilot Chrome,
writing `rows.json` v2.2-compatible rows. Engines: **google (AIO), chatgpt,
gemini, claude, grok**. The SKILL.md manual pilot remains the fallback and
the source of the per-engine mechanics (fresh conversation per prompt,
slice-only alias scanning, marker cells — never guesses).

This is a spike: the directory is removable (`rm -rf`), nothing is wired into
the skill contract yet, and the chat engines have NOT completed a live
validation run (see Status).

## Concurrency model — the lesson of 2026-10-03

**Parallel ACROSS engines, sequential WITHIN one engine.** Each engine gets
one worker tab running the prompt list one query at a time with randomized
human-like gaps (google ~30–75 s, chat engines ~90–180 s). That mirrors the
manual round-robin's rhythm, which never tripped a limit across T0 + re-runs.

A 3-tab burst against Google alone (~40 searches in ~40 min) hit Google's
**IP-wide** `/sorry` "unusual traffic" block AND escalated Cloudflare
challenges on chatgpt/claude/grok within the hour — personal browsing from
the same IP sees them too. They clear on their own (minutes to hours);
retrying does not speed that up.

Safeguards baked in:
- `/sorry` URL + VI/EN block patterns and blank-page/challenge detection →
  `error` cell, never a false `no_ai_overview`;
- login-wall detection → `login_required` cell (human's job);
- **circuit breaker**: an engine stops itself after 2 consecutive errors —
  it never grinds the whole list against a wall; other engines continue;
- every cell flushes to `--out` immediately; `--resume` skips cells that
  already have a terminal verdict and retries error/login cells.

## Run

```
cd geo-monitor/harvester
npm install
node harvester.mjs ^
  --prompts  E:\Web\workspace\t-order-test\prompts.csv ^
  --aliases  "t-order,torder,torder.net" ^
  --out      E:\Web\workspace\t-order-test\monitor\rows_harvest_<YYYY-MM-DD>.json ^
  --engines chatgpt,gemini --limit 1
```

Options: `--cdp <url>` (default `http://127.0.0.1:9222`; the pilot may sit on
another port — read `C:\Users\MAXSON\gtm-pilot-chrome\DevToolsActivePort`),
`--engines google,chatgpt,gemini,claude,grok` (default: google), `--limit N`,
`--hl vi`, `--timeout 180`, `--gap-min/--gap-max <s>` (override every
engine's built-in pacing), `--batch N --batch-gap <s>` (extra pause every N
runs per engine, for overnight jobs), `--resume`.

## Feeding the dashboard

The output is a **partial rows file** (only the engines that ran). To import
it alongside a full run, merge harvested cells into the complete
`rows_<date>.json` without ever overwriting it (importer join is verbatim on
prompt text — same prompts, so cells land on the right prompts). The merge
step is intentionally not written yet: finish live validation first.

## Status / known gaps

- **google**: validated live (verdicts matched the T0 cell on shared prompts);
  currently cooling down behind `/sorry` after the 2026-10-03 burst.
- **chatgpt/gemini/claude/grok**: drivers written from SKILL.md mechanics,
  zero live cells so far (the smoke attempt ran while the IP was already
  CF-challenged). Re-smoke 1 prompt/engine once challenges clear, then a
  full run before believing any numbers.
- `sentiment` stays empty (needs judgment; fill from `answer_text` later).
- `position` uses the prose rule only.
- No evidence PNGs / xlsx from the harvester (render from `answer_text` with
  `render_evidence.ps1` as usual).
- web_queries: google from visible chips (raw); chat engines apply the v2.2
  rule — links present but no visible searches → `["unavailable"]`, else `[]`.

## browser-use trial 2026-10-03 (verdict: harvester stays the runner)

One live cell (t-order-test row 1 × gemini) via browser-use 0.13.10 Agent on
the pilot Chrome, brain = opencode-go `qwen3.7-max` through
`ChatOpenAI(base_url=https://opencode.ai/zen/go/v1)` + static
`x-opencode-session/request` UUIDs. Trial dirs removed afterward
(`tools/browser-use-trial`, `tools/bu-live-trial`); this section is the record.

- Gateway facts (probes, all live): `tools`/function-calling HONORED
  (forced `tool_choice` → proper `tool_calls`); static UUID headers accepted
  across calls; `/v1/models` lists 36 models incl. `qwen3.7-max`, `glm-5.x`.
  GOTCHA: the gateway WAF 403s `Python-urllib/*` User-Agent (3/3 calls failed
  until UA was set to `node`/browser) — any Python driver must spoof UA.
- The cell completed: exact prompt submitted, full ~120 s stream waited out,
  1841-char clean UTF-8 Vietnamese answer extracted, deterministic verdict
  `mentioned=no` (no aliases; consistent with T0 Gemini 0%). $0 marginal cost.
- BUT `qwen3.7-max` repeatedly emits malformed tool calls (garbage `tab_id`
  `}}]5978…`, nested `close`) → 45 pydantic validation errors, 2× 75 s LLM
  timeouts, 24 steps for ONE cell; built-in judge: FAIL (no new tab, no
  two-read verification, possible answer reformatting vs raw page text).
- Decision: harvester (deterministic Node CDP) stays the runner — faster,
  cheaper, verbatim evidence. browser-use is fallback-only for selector-drifted
  engines, and then ONLY with deterministic CDP re-extraction + verdict outside
  the LLM (never trust agent text as canonical).
- Infra finding (same day): pilot was running with `--remote-debugging-port=0`
  (real CDP on ephemeral 58747) while port 9222 served 404 from a lingering
  background personal-chrome process — so chrome-devtools MCP + harvester
  default port were BOTH broken. Fixed by `taskkill /F /IM chrome.exe`
  (user's own action — agent never kills personal Chrome) + relaunch with the
  documented 9222 recipe. Verify live via `GET 127.0.0.1:9222/json/version`,
   NOT the `DevToolsActivePort` file: it stayed stale (dead 58747 + old guid)
   even after the clean 9222 relaunch.
- Retrial after pilot fix (same day, clean 9222): 11 steps, smoother drive,
  but the captured answer ends MID-SENTENCE at 1969 chars — the agent returns
  text through the LLM `done` action capped at `max_completion_tokens=4096`,
  so long answers are structurally truncated and any verdict on them risks
  false-negative. This settles it: agent text can scout/submit, but canonical
  evidence MUST come from deterministic CDP `innerText` extraction
  (harvester path), never from the agent's output.
- First 5×4 run 2026-10-03 (`rows_harvest_2026-10-03.smoke5.json`, google
  skipped): chatgpt 5/5 + gemini 5/5 in 15.4 min, zero blocks — pacing works.
  claude/grok halted by circuit breaker: their extractors still use dead
  selectors (`[data-message-author-role]`, grok `[data-testid=message]`) —
  next iteration rewrites both to slice-based extraction (proven tonight via
  pure MCP). Bugs fixed from this run: `waitStream` missing options default
  (every cell errored), `browser.close()` killing the shared pilot, missing
  `process.exit(0)` (orphan process), parallel row-creation race (split rows).
  NOTE: gemini said yes/top on row 1 in the probe but no on the same prompt
  an hour later — single answers are noisy; trends need repeats.
- Gap tuning validated: `--gap-min 40 --gap-max 60` on chat engines, zero
  blocks across 20+ cells (resume runs: 9.4 min + 2.6 min). Keep Google slow
  (single tab, 30–75 s+): its limit is per-IP aggregate, ~60 s/search already
  got blocked 03/10. JSON flush happens per cell BEFORE the gap, so shorter
  gaps lose no data. Final 5×4: row1 3/4 yes, row2 4/4 yes, rows 3–4 all no,
  row5 chatgpt-only yes. Same-prompt flips observed (chatgpt row4 yes→no,
  gemini row1 yes→no across conversations).
- Pure-MCP smoke 2026-10-03 (same prompt row 1, NO agent): gemini ok/no,
  chatgpt ok/YES (recommends T-Order), claude ok/YES (mentions T-Order),
  grok ok/YES (mentions T-Order) — CF "Just a moment" self-cleared on all
  three, logins intact everywhere. Grok: TEXTAREA takes 1 char, the DIV
  contenteditable takes the full prompt (use the DIV). MCP connect fix: the
  `DevToolsActivePort` file needs format `9222\n/devtools/browser/<guid>\n`
   with the LIVE guid (stale guid = silent connect failure). Google skipped
   (still in /sorry cooldown).
- Google AIO walk-up missed markers wrapped in STRONG/SPAN (20/20 false
  `no_ai_overview` 2026-10-03) — fixed by widening the leaf search, verified
  live on the pilot, re-ran with new `--redo <engines>` flag (re-runs terminal
  cells a driver fix invalidated). Real 3-10 google: 5 yes / 14 no / 1 genuine
  no_ai_overview. NEXT: filter cookie-consent junk (cookiepedia/onetrust/
  support.google.com boilerplate) at capture — gotcha #5 relived (3 attribution
  fallbacks + 5 dropped strings on re-import).
