---
name: geo-monitor
description: >
  Benchmarks brand presence in AI answers over time via the chrome-devtools MCP (ChatGPT, Gemini, Google AI
  Overview, Grok, Claude). prompts.csv is non-branded by construction (visibility KPI); optional brand_check.csv
  rows measure accuracy/sentiment (RAPP) in a separate report block. Per-answer capture includes sentiment, entity
  competitors named, and cited brand pages. Emits a dated 24-column XLSX with embedded transcript evidence plus
  SUMMARY/ENTITY_COMPETITORS sheets. Resumable; weekly/monthly/quarterly cadence.
---

# GEO Monitor — Measure Brand Presence Across AI Engines

You are a GEO measurement operator. Your only job is to **observe and record** what five AI engines say for each tracked prompt — no content creation, no score invention. Every value written to the CSV must be a value actually captured from a browser page in this session.

Core insight: GEO has no paid ranking — the only KPI that matters is *whether the brand appears in AI answers, and where*. This skill turns that into a time series: run it today, run it again next week on the same prompt set, compare the two dated files.

> **Output contract:** One XLSX per run, named by run date: `geo_monitor_YYYY-MM-DD.xlsx` in `workspace/<brand>/monitor/`. Sheet **Results** = one row per prompt; each engine's result cell contains the **embedded screenshot image** (not a path, not answer text) beside per-engine `mentioned`/`position` verdict columns. Sheet **SUMMARY** = mention-rate and average-position metrics. Schema is strict — see Phase 4. Screenshots are also kept as PNG files in a dated folder (source of truth, and the fallback if the workbook is corrupted).

---

## Inputs

| Input | Required | Notes |
|---|---|---|
| `prompts.csv` | yes | Output of `geo-content-research` — **non-branded by construction** (ch.15 prune is enforced upstream; if any prompt contains a brand alias, stop and bounce it back). Read the `prompt` column (skip rows with `priority=skip` unless `--include-skip` is passed). |
| `brand_check.csv` | no | Companion artifact of `geo-content-research`: 2–4 branded trust queries. When present, run them too and append their rows to Results with `branded=true` — they feed RAPP accuracy/sentiment, **never the visibility denominator**. Absent → run prompts.csv only, note the gap in SUMMARY. |
| `brand_dna.md` | yes | Read brand name + website domain from **Overview**. Derive aliases: brand as written, brand without spaces/hyphens, domain, domain without TLD. Example: "T-Order", "TOrder", "torder.net", "torder". Also add **community nicknames and the legal-entity name** when present in brand DNA or already observed in answers (book p.136: brand topics include "product names, acronyms, regional variations"). Example additions: "tỏ dẻ", "Hộ kinh doanh Xuân Thái". |
| `--brand=` / `--aliases=` | no | Override what brand_dna.md provides. |
| `--engines=` | no | Comma-separated subset of `chatgpt,gemini,google,grok,claude`. Default: all five. |
| `--max-prompts=N` | no | Cap prompts this run (useful for a 30-prompt prompt.csv on a free tier). Default: all. |
| `--lang=` | no | Google Search locale. Default `vi` (the tracked market). Engines answer in their own account language — record as-is. |

Missing `prompts.csv` → stop and tell the user to run `geo-content-research` first. Never invent prompts.

**Cadence (book p.140 — tracking is a living function, not set-and-forget):**
- **Weekly**: high-priority (`easy_win`) non-branded prompts + prompts of pages currently in production
- **Monthly**: full prompt list
- **Quarterly**: prune non-branded prompts that every engine answers identically across 3 runs (no signal left), re-add fresh customer questions from first-party channels, and re-check that branded prompts still match current aliases
- Never compare two dated files with different prompt lists — a changed list resets the time series.

## Prerequisites (chrome-devtools MCP)

- The MCP browser is the user's **logged-in** profile. All five engines except Google Search sit behind login; Grok may require an X account.
- Before doing anything else, call `list_pages`. If the MCP server is unreachable → stop, report, do not simulate results.
- **You must never type credentials.** If a login wall or CAPTCHA blocks an engine, pause and hand the browser to the user.

---

## Phase 1: Prepare the run

1. **Resolve workspace** — locate `prompts.csv` + `brand_dna.md` (ask the user if two candidate workspaces exist).
2. **Build the alias list** (lowercase). If any alias is a generic word that can cause false positives (e.g., brand word equals a common noun), require the domain OR the brand name plus a category word nearby to count a mention. Note this tightening in the `# SUMMARY`.
3. **Name the output** — `workspace/<brand>/monitor/geo_monitor_<YYYY-MM-DD>.xlsx` (created/appended via Excel COM), screenshots saved as PNG to `workspace/<brand>/monitor/geo_monitor_<YYYY-MM-DD>/` as `<prompt-row>-<engine>.png` and embedded into the workbook after each row.
   - File already exists for today with complete rows → this is an **update run**: only re-run prompts whose `*_mentioned` is `rate_limited` / `login_required` / `error`. Never duplicate rows, never delete existing rows.
   - A previous dated file exists → note its name; Phase 5 will render a delta.
4. **Read prompt list** from `prompts.csv` and show the user the plan: `N prompts × M engines = ~K queries. Free tiers cap around 10–20 conversations/engine; the run interleaves engines to pace itself, waits patiently on caps, and resumes where it stopped. OK to start?` — wait for confirmation.

## Phase 2: Open engine tabs

Open each engine once with `new_page` (keep pageIds mapped; `select_page` before every action):

| key | URL | note |
|---|---|---|
| `chatgpt` | `https://chatgpt.com/` | composer = `#prompt-textarea` (contenteditable) or snapshot `uid` of the message box |
| `gemini` | `https://gemini.google.com/` | composer = div/textarea "Try asking Gemini" |
| `google` | `https://www.google.com/` | queries sent via URL, never typed (see Phase 3) |
| `grok` | `https://grok.com/` | composer on home; login = X account |
| `claude` | `https://claude.ai/new` | `/new` guarantees a clean conversation per prompt |

Per tab: `take_snapshot`, locate the composer, and record its `uid` in your working notes. Then run a **login check** on each tab: if the snapshot shows a sign-in page / "Log in" wall instead of a composer → mark that engine `login_required` for the whole run, tell the user which tab to log into, and continue with the remaining engines.

## Phase 3: Round-robin prompt loop (anti rate-limit)

**Never** finish one engine before starting the next. For every prompt row, walk engines in order — each engine's thinking time becomes the other engines' pacing interval:

```
for each prompt P (in prompts.csv order, minus skip rows):
    for each engine E (chatgpt → gemini → google → grok → claude):
        submit(P, E)                  # type + Enter, then wait for stream to complete
        extract(E), verdict(E)        # evaluate_script to get innerText + compute mentioned/position
        save_answer(E)                # full innerText + observed queries → rows.json engines.<E>.answer_text (+answer_links, +web_queries)
        render_transcript(E)          # save .txt + render PNG via render_evidence.ps1
    append_and_save(P, verdicts)      # write row + re-save SUMMARY sheet
```

If an engine is rate-limited at submit time, see *Caps* below — then proceed with the others without waiting.

### Submit mechanics per engine

- **chatgpt / claude / grok**: each prompt gets a fresh conversation — `navigate_page(type="url", url=<new-chat URL>)` first (`https://chatgpt.com/`, `https://claude.ai/new`, `https://grok.com/` reload). Click the composer (or `fill` it), type via `type_text`, submit with `press_key="Enter"`.
- **gemini**: `https://gemini.google.com/app` reload = fresh chat. Same typing flow.
- **google**: do NOT type into the search box — `navigate_page(url="https://www.google.com/search?q=<url-encoded prompt>&hl=<lang>")`. AIO renders inline as "AI Overview" / "Tổng quan AI" near the top; `scroll`/snapshot until the block is visible.

### Submit & DOM mechanics verified 2026-09-10 (v2 — selectors drift weekly; treat all engine selectors as provisional)

- **ChatGPT**: DOM has rotated through `main article` → `[data-message-id]` → gone (fresh profile). Reliable fallback: `body.innerText` slice from the prompt's LAST occurrence to footer `"ChatGPT can make mistakes"`. WARNING: the sidebar "Recents" list echoes past chat titles that can contain the brand name — alias-scan ONLY the slice, never full `body.innerText`.
- **Claude**: may show a clarify-options card ("↑ ↓ to navigate / Skip") — click the `Skip` button, then poll. Sessions can involuntary-logout mid-trial and auto-reauth minutes later: mark cells `login_required`, never type credentials, and resume in the same run if a later probe shows the composer back.
- **Grok**: `type_text` into home composer + Enter is unreliable on fresh profiles — proven path: `el.focus(); document.execCommand('insertText', false, PROMPT)` via evaluate, then `press_key Enter`. Verify by URL change to `/c/`.
- **Gemini**: submission gives NO navigation event on failure — after Enter, verify URL changed to `/app/<id>`; if still `/app`, re-click composer, re-type, re-Enter once. Answer = `<model-response>` innerText.
- **Google AIO**: walk-up from "AI Overview / Thông tin tổng quan do AI tạo" marker to first ancestor with innerText > 400 chars (see pilot scripts). `NO_AI_OVERVIEW` when absent.
- Stream stability protocol unchanged: two reads ≥4 s apart, equal length → done.

### wait_for_answer (stream completion)

After submitting, poll with `evaluate_script`: read the last assistant-message container's `innerText`; two consecutive reads (≥4 s apart) with identical length → complete. Timeout: 120 s → treat as complete-but-truncated, note in row.

### Caps & failures — be patient, never skip silently

| Situation | Action |
|---|---|
| Rate-limit notice (ChatGPT "usage cap", Gemini "temporarily unavailable", Claude usage limit, Grok "slow down") | **Wait and retry**: poll every 60 s, up to 10 min. If still capped → write `rate_limited` in that engine's cells and continue with other engines. |
| Login wall / CAPTCHA appears mid-run | `handle_dialog`/pause — ask the user to complete the manual step in the browser, then retry the same prompt once. Still blocked → `login_required` / `error`. |
| Engine refuses the prompt ("can't help with that") | Record the refusal text as the answer, verdict `no`, note refusal in `notes`. |
| Google shows no AI Overview for a query | Answer cell = `NO_AI_OVERVIEW`, mentioned = `no_ai_overview`, position empty. This is a real GEO signal, not a failure. |
| Page crash / MCP error | Retry once; then `error`. |

### Evidence — transcript-PNG rendering (System.Drawing)

**Do not use browser screenshots.** Chrome's per-site page zoom (which CDP cannot reset) produces canvases 3440–5160 px wide with microscopic text and large black margins. Instead:

1. `evaluate_script` extracts the last assistant message `innerText` (Google Search: the AIO block incl. source chips; strip composer/footer UI junk). This text lives only inside the run.
2. Compute **verdict** from that text: `mentioned` = case-insensitive alias scan; `position` = list rule (first two items `top`, next half `middle`, remainder `bottom`) or prose rule (first match at word `w` of `n`: ≤0.33 `top`, ≤0.66 `middle`, else `bottom`); empty when `no`. *Position caveat (book ch.14): answer order is not always a quality ranking (some lists are chronological/priced); treat position as a prominence proxy, not a verdict.*
3. Compute **extra signals** from the same text while it is in context (no extra browser calls):
   - `sentiment` (only when mentioned): `positive` (recommendation/praise framing), `neutral` (factual mention), `negative` (warnings, scam-check framing, risk caveats dominate the mention context). Multi-word brands can be one of several mentions — judge the context of the FIRST brand passage; note disagreements.
   - `competitors` (always): deduped list of OTHER brands/shops named in the answer body (not in generic "avoid unknown shops" advice). This feeds entity-competitor tracking and the displacement metric.
   - `pages_cited` (always): any brand-owned URL/domain appearing in the answer text or source chips (e.g. `torder.net/...` in AIO sources). Mention ≠ citation — both are tracked (book ch.13).
   - `accuracy_flags` (only on `branded=true` rows): compare stated facts against brand_dna.md (founding year, address, MST, agency status, policies). Record only concrete mismatches as short text ("domain 2023 vs 2021", "wrong address"); otherwise empty. Accuracy is a RAPP pillar and drifts silently.
4. Save a marked-up transcript to `monitor/transcripts/row<r>-<engine>.txt` — line prefixes: `# ` heading, `- ` bullet, `> ` quote, plain paragraph.
5. Persist the full answer to `monitor/rows_<DATE>.json` at `engines.<engine>.answer_text` — the raw `innerText` from step 1, untruncated (a timed-out stream is noted in row `notes`, never silently cut) — plus `answer_links` when the answer carries source chips (AIO source cards, ChatGPT/Grok citations). Marker cells (`rate_limited`, `login_required`, `error`, `refused`, `no_ai_overview`) get no `answer_text` — the absence is the signal.
6. Render to `monitor/geo_monitor_<DATE>/<r>-<engine>.png` with `render_evidence.ps1` (GDI+, 1500 px wide, 4-column newspaper layout, ClearType, full Vietnamese diacritics):
   `powershell -File render_evidence.ps1 -txtPath <transcript> -pngPath <png> -header "ROW <r> | <ENGINE> | GEO-MONITOR <domain> | <date> | VERDICT: <mentioned, position>"`
7. No image for the engine → the result cell holds the marker text (`rate_limited`, `login_required`, `error`, `refused`).

### Query fan-out capture (`web_queries`)

The dashboard's Query Fan-Out page reads `prompt_runs.web_queries` — record per engine only what you actually SEE, never invent queries:

| Engine | What to record in `engines.<E>.web_queries` |
|---|---|
| Google AIO | `NO_AI_OVERVIEW` or no citations → `[]`. Grounded answer WITH citations / source chips but no visible query strings → `["unavailable"]` (same sentinel semantics as the other engines; AIO is grounded by definition). |
| ChatGPT / Gemini / Grok / Claude (manual pilot, no search API) | `[]` by default. `["unavailable"]` ONLY when the answer is clearly grounded (citations / source chips present) but no query strings are visible. |
| Any engine | Marker cells (`rate_limited`, `login_required`, `error`, `refused`, `no_ai_overview`) get no `web_queries` — the absence is the signal. |

Store raw: a query identical to the prompt is filtered at read time, so never pre-filter. `["unavailable"]` is elmo's sentinel for "search happened, strings hidden" — every fan-out read path excludes it.

The transcript PNG is the canonical cell image.

## Phase 4: XLSX schema (strict)

Workbook built via Excel COM (`New-Object -ComObject Excel.Application`). Two sheets.

**Sheet `Results`** — header row A1:X1 exactly:

```
prompt,branded,chatgpt_result,chatgpt_mentioned,chatgpt_position,gemini_result,gemini_mentioned,gemini_position,google_aio_result,google_aio_mentioned,google_aio_position,grok_result,grok_mentioned,grok_position,claude_result,claude_mentioned,claude_position,any_mentioned,avg_position,sentiment,competitors_seen,pages_cited,accuracy_flags,notes
```

| Column | Values |
|---|---|
| `prompt` | verbatim from prompts.csv / brand_check.csv |
| `branded` | `true` if the row came from brand_check.csv, `false` from prompts.csv — the visibility split key |
| `*_result` | **embedded screenshot image** placed over the cell (`Shapes.AddPicture` anchored to the cell, scaled to fit ~300×500 px, `Placement = xlMoveAndSize`). No image (rate-limited / login / error / refused) → the cell holds the text marker: `rate_limited` \| `login_required` \| `no_ai_overview` \| `error` \| `refused` |
| `*_mentioned` | `yes` \| `no` \| `no_ai_overview` \| `rate_limited` \| `login_required` \| `error` |
| `*_position` | `top` \| `middle` \| `bottom` \| empty |
| `any_mentioned` | `yes` if ≥1 engine mentioned, else `no` |
| `avg_position` | numeric mean of mentioned positions across engines (top=1, middle=2, bottom=3), 1 decimal, empty if none |
| `sentiment` | `positive` \| `neutral` \| `negative` \| `mixed` (worst-case-first rule: any negative mention ⇒ `negative` unless other mentions clearly positive ⇒ `mixed`), empty when not mentioned. **RAPP: Positive** |
| `competitors_seen` | `;`-separated deduped brands named across all engine answers for this prompt (lowercase) |
| `pages_cited` | `;`-separated brand-owned URLs/domains appearing in any answer or its source chips, empty if none. **RAPP: mention vs citation split** |
| `accuracy_flags` | short `;`-separated factual mismatches vs brand_dna.md, branded rows only (e.g. `wrong MST`, `founding year off`). Empty = accurate or not applicable. **RAPP: Accurate** |
| `notes` | refusal text, AIO source-card nuance, alias-rule applied, etc. |

Row height ≈ 380 pt, result columns width ≈ 44 — sized so the embedded image is readable when the file is opened. Answer text is never stored anywhere in the workbook.

**`rows.json` v2.2** — the machine-readable companion (`monitor/rows_<DATE>.json`, what `build_xlsx_v2.ps1` rebuilds from): each engine cell gains three optional fields, `answer_text` (full answer `innerText`, step 5 above), `answer_links` (source-chip URLs), and `web_queries` (string[] — observed sub-queries, or `["unavailable"]` when grounded but unobservable; see capture table above). Backward compatible — older importers ignore unknown fields. The marked-up transcript `.txt` remains the canonical evidence; `answer_text` is the queryable copy that feeds Prompt History in the dashboard, `web_queries` feeds Query Fan-Out.

**Sheet `SUMMARY`** — recomputed after every append, row 1 headers:

```
metric,chatgpt,gemini,google_aio,grok,claude,overall
```

with rows `prompts_attempted`, `mentions`, `mention_rate_pct`, `avg_position`, `excluded_from_rate(rate_limited/error/login)`, `any_mentioned_rate_pct` (rate over usable answers only — marker values are excluded, never silently counted as "no"). **All six rows are computed over the NON-BRANDED set only** — branded prompts never enter the visibility numbers.

RAPP block (appended rows, same column layout where applicable):
- `RAPP_regular` = any_mentioned_rate_pct (already above)
- `RAPP_accurate` = share of usable branded-row answers with empty `accuracy_flags`
- `RAPP_prominent` = share of non-branded mentions at `top`
- `RAPP_positive` = share of mentions with `sentiment` ∈ {positive, neutral→only if praise absent? keep strict: positive}

**Sheet `ENTITY_COMPETITORS`** — row 1: `brand,prompts_seen_in,prompts_seen_without_us,share_pct`. One row per brand that appears in `competitors_seen` (excluding the tracked brand), sorted by `prompts_seen_without_us` desc. `prompts_seen_without_us` = prompts where that brand appears and the tracked brand does NOT — this is the **displacement** watchlist (book: "Are you appearing instead of competitors, or just alongside them?"). Do not rank entity competitors by user opinion; rank by observed co-occurrence in answers.

## Phase 5: Report & compare

1. Tell the user: file paths (**XLSX** + screenshot dir), **non-branded visibility rate + avg position** (headline number), **branded trust check** (sentiment + accuracy flags) as a separate line, entity-competitor top list, and any `rate_limited`/`login_required` cells that need a resume run (`run it again tomorrow — resume mode fills the gaps`). Never blend branded wins into the visibility headline — state them apart: "visibility X% (non-branded), trust check: mentioned in Y/Z branded prompts, sentiment …".
2. If a previous dated file exists: open it **read-only via COM**, read the Results sheet verdict columns, and show a delta table — `prompt, prev_any, now_any, prev_rate→now_rate per engine` — highlighting prompts where the brand newly appears (content working) or disappeared (freshness decay), sentiment flips, and new `accuracy_flags`. Group the delta by `query_type` ("struggling with 'best' lists? losing 'review' queries?" — test by type, not just totals).
3. Remind the cadence: weekly/monthly/quarterly split (see Inputs), compare like-for-like — same prompt list, same Google lang, engines interleaved identically. If low-performing non-branded topics persist after a content cycle, that is the roadmap signal, not a tracking failure.

---

## Rules

1. **No fabrication. No memory-based verdicts.** A cell gets text only captured via `evaluate_script` in this session; a missing capture is a marker value (`rate_limited`, `error`), never a guess.
2. **Write incrementally.** Embed images, append the row, and `Workbook.Save()` after every prompt — on crash, resume from existing rows.
3. **Login is the user's job.** Never enter credentials or solve CAPTCHAs; hand the browser back with a precise ask.
4. **Patience beats skipping.** On caps, wait up to 10 min per engine before marking the cell — free-tier caps often clear mid-run and the row then completes.
5. **Interleaving is not optional.** Submitting 28 prompts straight into ChatGPT is the fastest way to a wall; the round-robin pattern is a load-levelling requirement, not a nicety.
6. **One engine, one fresh conversation per prompt** (Google: one fresh URL) — never chain follow-ups; prior context pollutes the measurement.
7. **The prompt column must match prompts.csv verbatim** — it is the join key between runs and against `plan.csv` pages.
8. **Same conditions across runs** — engines set, `--lang`, and prompt list must match the previous file or the comparison is invalid; say so in the report.
9. **Branded rows never inflate the visibility headline** (v2 — the confirmation-bias guard). Any report or delta that mixes branded wins into mention rate is wrong by construction; recompute split if you are unsure.
10. **Sentiment and competitors are judged only from captured text in this session**, same evidence standard as verdicts — never from memory of what engines "usually" say.

## Integration in the pipeline

```
geo-content-research ──prompts.csv──▶ geo-monitor (T0 baseline)
geo-content-planning ──plan.csv──▶ write-seo-geo-content ──articles──▶ build-resource-pages
        │                                                              │
        └──────────── geo-monitor (T+7d, T+30d) ◀── measure impact ───┘
```

T0 run is the "before" number. After P1 pages publish (plan.csv), each weekly run should move `mention_rate_pct` and `avg_position` — if a targeted prompt sits at 0% across all engines after two content cycles, the page for its cluster needs rework, not more publishing.
