# prompts.csv — Artifact Schema (v2)

Enforced output contract for the `geo-content-research` skill.
The skill runner validates the output against this schema.
Malformed output fails the artifact.

## File format

- Format: CSV (RFC 4180)
- Encoding: UTF-8, no BOM
- Line endings: LF (`\n`)
- Delimiter: comma (`,`)
- Quoting: fields containing comma, newline, or double-quote MUST be double-quoted; embedded `"` escaped as `""`
- First row: header, exactly matching the column names below, in this order
- No code fences, no leading/trailing prose

## Columns (in order)

| # | Column | Type | Required | Allowed values / format |
|---|--------|------|----------|-------------------------|
| 1 | `prompt` | string | yes | full natural-language query, ≥ 5 words, unique (case-insensitive), **must not contain any brand alias listed in brand_dna.md → Brand Topics** (v2 pruning rule, book ch.15) |
| 2 | `tier` | enum | yes | `buy` \| `solve` \| `learn` |
| 3 | `citability` | enum | yes | `high` \| `medium` \| `low` |
| 4 | `competition` | enum | yes | `none` \| `low` \| `medium` \| `hard` |
| 5 | `priority` | enum | yes | `easy_win` \| `target` \| `skip` |
| 6 | `query_type` | enum | yes | `definition` \| `recommendation` \| `comparison` \| `evaluation` \| `how_to` \| `cost` \| `landscape` \| `use_case` |
| 7 | `cluster` | string | yes | non-empty, groups related prompts (snake_case recommended) |
| 8 | `target_engines` | string | yes | `\|`-separated subset of the engine set locked in Step 2-P (known names: `chatgpt`, `perplexity`, `claude`, `gemini`, `ai_overview`); at least one |
| 9 | `brand_mention_mechanism` | string | yes | non-empty — concrete description of how brand appears in AI answer |
| 10 | `notes` | string | no | free text; provenance tags (`seed:first_party`, `seed:paa`, `seed:reddit`, `seed:longtail`, `seed:engine_chip`, `seed:ai_expansion`) go here |

## Companion artifact — brand_check.csv (v2)

Not part of prompts.csv. 2–4 branded rows emitted as a `---BRAND_CHECK_BEGIN/END---` block BEFORE the final response, saved by the operator as `brand_check.csv`:

Columns: `prompt,focus,rationale` — `focus` ∈ `accuracy` | `sentiment`. These feed geo-monitor's branded set (flagged in Results, never counted in the visibility denominator).

## Row rules

- Every prompts.csv row must have exactly 10 fields
- `prompt` must be unique across rows (case-insensitive)
- At least 20 data rows
- Tier distribution guideline (not enforced): ~20% buy, ~40% solve, ~40% learn. Listed for the model's benefit; validator accepts any mix.
- Prompts with `priority=skip` SHOULD still be emitted (they're useful intel about what NOT to chase) but can be omitted if the list is long.
- `brand_mention_mechanism` cannot be vague ("builds awareness"). Must describe the concrete mechanism (e.g. "named in top 5 platforms list alongside [Competitor A]").

## Example (header + 3 rows)

```
prompt,tier,citability,competition,priority,query_type,cluster,target_engines,brand_mention_mechanism,notes
what is the best geo optimization platform,buy,high,low,easy_win,recommendation,geo_platforms,chatgpt|perplexity|claude|gemini,named in top-5 list alongside profound and otterly,seed:paa
tự order hàng taobao so với thuê dịch vụ trung gian cái nào rủi ro ít hơn,buy,high,none,easy_win,comparison,order_service,chatgpt|perplexity|gemini,brand's cost-vs-risk comparison table cited as the service option,seed:reddit
what is generative engine optimization,learn,medium,hard,skip,definition,geo_fundamentals,chatgpt,brand cited as expert source via author bio,
```

## Validation failure modes

The artifact is marked `failed` if any of these hold:

- Output is not parseable as CSV
- Header row does not match exactly (names + order)
- Any required column is missing for any row
- Any enum column has a value outside its allowed set
- `prompt` is empty, < 5 words, or duplicated (case-insensitive)
- `prompt` contains a brand alias from Brand Topics (case-insensitive, incl. hyphen/space variants) — **the ch.15 prune is machine-enforced**
- `target_engines` contains a value outside the allowed set, outside the Step 2-P locked set, or is empty
- `brand_mention_mechanism` is empty
- Fewer than 20 data rows
- Output wrapped in a code fence or contains prose before the header
