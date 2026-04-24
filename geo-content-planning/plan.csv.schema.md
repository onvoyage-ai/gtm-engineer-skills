# plan.csv — Artifact Schema

Enforced output contract for the `geo-content-planning` skill.
The skill runner validates the output against this schema, including
cross-reference checks against `keywords.csv` and `prompts.csv`.

## File format

- Format: CSV (RFC 4180), UTF-8, LF line endings
- First row: header, exactly matching the column names below, in this order
- No code fences, no leading/trailing prose

## Columns (in order)

| # | Column | Type | Required | Allowed values / format |
|---|--------|------|----------|-------------------------|
| 1 | `page_id` | string | yes | snake_case slug, unique (e.g. `best_geo_platforms_2026`) |
| 2 | `priority` | enum | yes | `p1` \| `p2` \| `p3` |
| 3 | `page_type` | enum | yes | `money` \| `comparison` \| `use_case` \| `trust` \| `definition` |
| 4 | `section` | enum | yes | `product` \| `use_cases` \| `resources` |
| 5 | `subsection` | enum \| empty | conditional | `guides` \| `comparisons` \| `learn` \| `blog` — REQUIRED iff `section=resources`; MUST be empty otherwise |
| 6 | `title` | string | yes | non-empty, natural language |
| 7 | `url_slug` | string | yes | non-empty path (starts with `/`), unique |
| 8 | `target_keywords` | string | yes | `\|`-separated; every value MUST appear in `keywords.csv` (case-insensitive match against the `keyword` column) |
| 9 | `target_prompts` | string | yes | `\|`-separated; every value MUST appear in `prompts.csv` (case-insensitive match against the `prompt` column, `?` ignored) |
| 10 | `required_sections` | string | yes | `\|`-separated from {`direct_answer`, `comparison_table`, `who_this_is_for`, `how_it_works`, `use_cases`, `faqs`, `proof`, `objections`}; ≥ 1 |
| 11 | `why_it_matters` | string | yes | non-empty, concrete business reason (≥ 15 chars) |

## Row rules

- Every row must have exactly 11 fields
- `page_id` must be unique across rows
- `url_slug` must be unique across rows
- At least 5 data rows total
- At least one row with `priority=p1`
- `section=resources` requires a non-empty `subsection`
- `section ∈ {product, use_cases}` requires an empty `subsection`
- Every entry in `target_keywords` must be present in `keywords.csv`
- Every entry in `target_prompts` must be present in `prompts.csv`

## Cross-reference enforcement

The validator loads `keywords.csv` and `prompts.csv` from the agent workspace
and fails the artifact if any referenced keyword or prompt does not exist.
This guarantees the plan is grounded in real research, not hallucinated.

If either reference file is missing from the workspace, the validator still
runs the structural schema check but skips cross-reference validation and
emits a warning. In practice this should not happen when the pipeline is
running correctly (research-keywords and geo-content-research run first).

## Example (header + 2 rows)

```
page_id,priority,page_type,section,subsection,title,url_slug,target_keywords,target_prompts,required_sections,why_it_matters
best_geo_platforms_2026,p1,comparison,resources,comparisons,Best GEO Platforms in 2026: Voyage vs Profound vs Otterly,/resources/compare/best-geo-platforms,geo tool|geo platform,what is the best geo optimization platform|top generative engine optimization companies,direct_answer|comparison_table|faqs|proof,Owns the "best" query cluster that drives highest-intent buyer traffic
how_to_optimize_for_ai_citations,p1,money,product,,How to Optimize Content for AI Citations,/product/ai-citation-optimization,geo tool|content brief,how do i optimize content for ai citations|how to write content that ai will cite,direct_answer|how_it_works|faqs|proof,Product page anchoring the core solve-tier search intent
```

## Validation failure modes

- Output is not parseable as CSV
- Header row does not match exactly
- Any row does not have exactly 11 fields
- Any enum column has a value outside its allowed set
- `page_id` or `url_slug` duplicated
- `section=resources` with empty `subsection`
- `section ∈ {product, use_cases}` with non-empty `subsection`
- Fewer than 5 data rows
- No row with `priority=p1`
- `target_keywords` references a keyword not in `keywords.csv`
- `target_prompts` references a prompt not in `prompts.csv`
- `required_sections` empty
- `why_it_matters` empty or too short
