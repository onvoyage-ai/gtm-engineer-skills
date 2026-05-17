# Local Testing Guide for Contributors

This guide explains how to run skills locally before submitting a PR.

Skills are agent prompts — there's no build step or test suite. Testing means installing the skill, running it against a real input, and verifying the output matches the expected format.

---

## Prerequisites

You need at least one of:

- **Claude Code** — [install guide](https://docs.anthropic.com/en/docs/claude-code)
- **Codex** (OpenAI) — for `reddit-opportunity-research` workflows

Both tools support the shared `SKILL.md` agent-skills pattern used in this repo.

---

## 1. Set Up Your Local Skills

From the repo root, symlink the skill(s) you're modifying into your tool's skills directory.

**Claude Code:**

```bash
mkdir -p ~/.claude/skills
ln -s "$PWD/research-brand" ~/.claude/skills/research-brand
ln -s "$PWD/improve-aeo-geo" ~/.claude/skills/improve-aeo-geo
# Repeat for any other skill you're testing
```

**Codex:**

```bash
mkdir -p ~/.codex/skills
ln -s "$PWD/research-brand" ~/.codex/skills/research-brand
```

If the symlink already exists (you've previously installed this skill), remove it first:

```bash
rm ~/.claude/skills/research-brand
ln -s "$PWD/research-brand" ~/.claude/skills/research-brand
```

> Changes to `SKILL.md` take effect immediately — no restart needed. The agent reads the file at invocation time.

---

## 2. Create a Test Workspace

The `workspace/` directory is gitignored. Use it for all test outputs so nothing leaks into your PR.

```bash
mkdir -p workspace/test-run
```

Open Claude Code or Codex pointing at this repo root, or `cd` into your workspace before invoking skills.

---

## 3. Run the Skill

Invoke the skill by its slash command. Use a real input — skills are prompts, and vague inputs produce hard-to-evaluate outputs.

### Research skills

| Skill | Command | Minimal test input |
|---|---|---|
| `research-brand` | `/research-brand` | A real company URL (e.g. `https://linear.app`) |
| `audit-website-aeo` | `/audit-website-aeo` | A real website URL (e.g. `https://linear.app`) |
| `research-keywords` | `/research-keywords` | An existing `brand_dna.md` in your workspace |
| `geo-content-research` | `/geo-content-research` | An existing `brand_dna.md` |
| `reddit-opportunity-research` | `/reddit-opportunity-research` | An existing `brand_dna.md` |

### Planning and writing skills

| Skill | Command | Required inputs |
|---|---|---|
| `geo-content-planning` | `/geo-content-planning` | `brand_dna.md` + `keyword_research.md` + `geo_prompt_targets.md` (or `prompts.csv`) |
| `write-seo-geo-content` | `/write-seo-geo-content` | `content_architecture.md` (or `plan.csv`) |
| `create-geo-charts` | `/create-geo-charts` | A content brief or draft article |
| `audit-content` | `/audit-content` | One or more draft articles |
| `build-backlinks` | `/build-backlinks` | `brand_dna.md` |

### Code modification skills

| Skill | Command | Required inputs |
|---|---|---|
| `improve-aeo-geo` | `/improve-aeo-geo` | A website codebase open in your editor |
| `build-resource-pages` | `/build-resource-pages` | Audited content files + a target codebase |

For `improve-aeo-geo`, you can use any open-source website repo as a test target. A minimal Next.js or Hugo starter works well.

---

## 4. Validate the Output

### Skills with CSV output contracts

Three skills enforce a strict CSV schema. After running the skill, validate the output file against its schema:

| Skill | Output file | Schema |
|---|---|---|
| `geo-content-research` | `prompts.csv` | [`geo-content-research/prompts.csv.schema.md`](geo-content-research/prompts.csv.schema.md) |
| `geo-content-planning` | `plan.csv` | [`geo-content-planning/plan.csv.schema.md`](geo-content-planning/plan.csv.schema.md) |

Check these manually:

1. Open the CSV in a spreadsheet tool or `csvlint`
2. Confirm the header row matches the schema exactly (column names and order)
3. Confirm all enum values are within the allowed set
4. Confirm row counts meet minimums (20+ rows for `prompts.csv`, 5+ for `plan.csv`)
5. Confirm no code fences or prose appear before the header row

A quick shell check for row count:

```bash
# Subtract 1 for the header row
wc -l < workspace/test-run/prompts.csv
```

### Skills with markdown output

For `research-brand`, `research-keywords`, and content-writing skills, check that the output:

- Is a single file saved to the expected path (e.g. `brand_dna.md`)
- Contains all required sections (defined in the skill's `SKILL.md`)
- Does not include fabricated statistics — any number cited must include a source name and year
- Is written in the brand's voice (for content skills) or structured per the defined format

### Skills with a bundled script

`audit-website-aeo` ships a zero-dependency Node crawler at `scripts/aeo-audit.mjs`. Test it directly before testing the full skill:

```bash
node audit-website-aeo/scripts/aeo-audit.mjs https://linear.app --max-pages=5 --out=workspace/test-run/aeo-audit.json
```

Verify the script:

- Runs on Node 18+ with no `npm install`
- Prints a summary and writes valid JSON (`node -e "require('./workspace/test-run/aeo-audit.json')"`)
- Reports a `foundationalScore` and 16 checks; crawls the requested page count

Then run `/audit-website-aeo` and confirm it produces a single `aeo_audit_report.md` with a final score, an A-F grade, and all 6 intelligence dimensions scored with rationale.

### Code modification skills

For `improve-aeo-geo` and `build-resource-pages`, verify:

- The skill correctly identifies the framework before making changes
- Changes are targeted — no files modified outside the described scope
- The modified site still builds (`npm run build` or equivalent)
- If testing against a scored site, run [aeo-audit.sh](https://aeo-audit.sh) before and after to confirm the score improves

---

## 5. Testing Checklist Before Submitting a PR

Before opening a PR, confirm each item for the skill(s) you changed:

- [ ] Skill is symlinked locally and runs without error
- [ ] Output file is generated at the expected path with the expected filename
- [ ] All required sections/fields are present in the output
- [ ] No fabricated data — every statistic has a named source with a year
- [ ] CSV outputs pass schema validation (if applicable)
- [ ] Code modification skills leave the target project buildable
- [ ] New framework patterns tested against [aeo-audit.sh](https://aeo-audit.sh) and score improves
- [ ] New research added to the Research References table in `SKILL.md` with a link to the primary source
- [ ] Example files (if added) match the format of existing examples in `examples/`

---

## Common Issues

**Skill not found when invoking slash command**
Make sure the symlink points to the folder containing `SKILL.md`, not to `SKILL.md` itself:
```bash
ls ~/.claude/skills/research-brand/SKILL.md  # should exist
```

**Output written to wrong directory**
Skills save output relative to your current working directory or the project directory open in your editor. Open Claude Code at the repo root or your `workspace/test-run/` folder before invoking.

**CSV output wrapped in a code fence**
Some models wrap output in triple backticks despite the schema prohibiting it. This is a failure mode — strip the fences and note it in your PR if it happens consistently, as it may indicate a prompt wording issue.

**`geo-content-planning` fails cross-reference check**
`plan.csv` references keywords from `keywords.csv` and prompts from `prompts.csv`. Run `research-keywords` and `geo-content-research` first to generate those files, or seed them manually with at least a few rows.
