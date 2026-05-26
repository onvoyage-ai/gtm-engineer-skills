# Evals

This directory is the starting point for automated skill evaluation.

## Current Scope

- **Contract evals** for strict CSV artifacts:
  - `research-keywords`
  - `geo-content-research`
  - `geo-content-planning`
- **Deterministic runtime eval** for:
  - `audit-website-aeo/scripts/aeo-audit.mjs`

These checks are intentionally offline and reproducible. They do not depend on live web search or external model APIs.

## Run

```bash
npm run test:evals
```

Or run individual lanes:

```bash
npm run test:evals:contracts
npm run test:evals:audit
```

## Layout

```text
evals/
  fixtures/   # frozen test inputs and local websites
  lib/        # validators and helpers
  tests/      # node:test suites
```

## Next Lanes

- Markdown/report artifact checks for `research-brand`, `reddit-opportunity-research`, `build-backlinks`
- Output-structure checks for `write-seo-geo-content` and `create-geo-charts`
- Seeded repo evals for `improve-aeo-geo` and `build-resource-pages`
- Optional live canary lane for search-dependent skills
