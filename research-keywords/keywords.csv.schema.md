# keywords.csv — Artifact Schema

This is the **enforced output contract** for the `research-keywords` skill.
The skill runner validates the skill's output against this schema.
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
| 1 | `keyword` | string | yes | 1–3 words, lowercase, no leading/trailing whitespace |
| 2 | `volume` | integer \| empty | no | `0` or positive integer; empty if unknown |
| 3 | `kd` | integer \| empty | no | `0`–`100`; empty if unknown |
| 4 | `intent` | enum | yes | `informational` \| `commercial` \| `research` \| `transactional` |
| 5 | `priority` | enum | yes | `easy_win` \| `target` \| `content` \| `hard` |
| 6 | `cluster` | string | yes | non-empty, snake_case or free text |
| 7 | `is_pillar` | boolean | yes | `true` \| `false` |
| 8 | `ai_overview_present` | boolean \| empty | no | `true` \| `false` \| empty if not checked |
| 9 | `source` | string | yes | non-empty; one of `ahrefs`, `semrush`, `serpapi`, `autocomplete`, `paa`, `reddit`, `competitor`, `manual` |
| 10 | `notes` | string | no | free text |

## Row rules

- Every row must have exactly 10 fields
- `keyword` must be unique across all rows (no duplicates)
- At least one row with `is_pillar=true` per `cluster`
- At least 10 rows total (skills producing < 10 rows fail validation)
- Keywords with `volume=0` (confirmed zero from paid tool) MUST be removed, not emitted

## Example (header + 3 rows)

```
keyword,volume,kd,intent,priority,cluster,is_pillar,ai_overview_present,source,notes
synthetic data,2400,42,research,target,synthetic_data,true,true,ahrefs,high GEO signal
data labeling,1900,38,commercial,target,synthetic_data,false,true,ahrefs,
vla model,320,12,research,easy_win,robotics_models,true,,serpapi,uncontested niche
```

## Validation failure modes

The artifact is marked `failed` if any of these hold:

- Output is not parseable as CSV
- Header row does not match exactly (name + order)
- Any required column is missing for any row
- Any enum column has a value outside its allowed set
- `keyword` is empty, > 3 words, or duplicated
- `volume` / `kd` / `is_pillar` / `ai_overview_present` fail their type check
- Fewer than 10 data rows
- Output is wrapped in a code fence or contains prose before the header

Fix the output and the artifact can be retried.
