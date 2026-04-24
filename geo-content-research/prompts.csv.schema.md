# prompts.csv — Artifact Schema

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
| 1 | `prompt` | string | yes | full natural-language query, ≥ 5 words, unique (case-insensitive) |
| 2 | `tier` | enum | yes | `buy` \| `solve` \| `learn` |
| 3 | `citability` | enum | yes | `high` \| `medium` \| `low` |
| 4 | `competition` | enum | yes | `none` \| `low` \| `medium` \| `hard` |
| 5 | `priority` | enum | yes | `easy_win` \| `target` \| `skip` |
| 6 | `query_type` | enum | yes | `definition` \| `recommendation` \| `comparison` \| `evaluation` \| `how_to` \| `cost` \| `landscape` \| `use_case` |
| 7 | `cluster` | string | yes | non-empty, groups related prompts (snake_case recommended) |
| 8 | `target_engines` | string | yes | `\|`-separated subset of `chatgpt`, `perplexity`, `claude`, `gemini`, `ai_overview`; at least one |
| 9 | `brand_mention_mechanism` | string | yes | non-empty — concrete description of how brand appears in AI answer |
| 10 | `notes` | string | no | free text |

## Row rules

- Every row must have exactly 10 fields
- `prompt` must be unique across rows (case-insensitive)
- At least 20 data rows
- Tier distribution guideline (not enforced): ~20% buy, ~40% solve, ~40% learn. Listed for the model's benefit; validator accepts any mix.
- Prompts with `priority=skip` SHOULD still be emitted (they're useful intel about what NOT to chase) but can be omitted if the list is long.
- `brand_mention_mechanism` cannot be vague ("builds awareness"). Must describe the concrete mechanism (e.g. "named in top 5 platforms list alongside [Competitor A]").

## Example (header + 4 rows)

```
prompt,tier,citability,competition,priority,query_type,cluster,target_engines,brand_mention_mechanism,notes
what is the best geo optimization platform,buy,high,low,easy_win,recommendation,geo_platforms,chatgpt|perplexity|claude|gemini,named in top-5 list alongside profound and otterly,
how do i optimize content for ai citations,solve,high,medium,target,how_to,content_strategy,chatgpt|perplexity|claude,brand's methodology cited as reference approach,
voyage vs profound which is better,buy,high,none,easy_win,comparison,geo_platforms,chatgpt|perplexity,comparison table authored by brand - byline builds association,
what is generative engine optimization,learn,medium,hard,skip,definition,geo_fundamentals,chatgpt,brand cited as expert source via author bio,
```

## Validation failure modes

The artifact is marked `failed` if any of these hold:

- Output is not parseable as CSV
- Header row does not match exactly (names + order)
- Any required column is missing for any row
- Any enum column has a value outside its allowed set
- `prompt` is empty, < 5 words, or duplicated (case-insensitive)
- `target_engines` contains a value outside the allowed set or is empty
- `brand_mention_mechanism` is empty
- Fewer than 20 data rows
- Output wrapped in a code fence or contains prose before the header
