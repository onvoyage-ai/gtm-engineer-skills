import test from "node:test";
import assert from "node:assert/strict";
import { readText, validateKeywordsCsv, validatePlanCsv, validatePromptsCsv } from "../lib/csv-contracts.mjs";

const root = new URL("../fixtures/contracts/", import.meta.url);

test("keywords.csv valid fixture passes", () => {
  const result = validateKeywordsCsv(readText(new URL("keywords.valid.csv", root)));
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("keywords.csv invalid fixture fails on wrapper prose and duplicates", () => {
  const result = validateKeywordsCsv(readText(new URL("keywords.invalid.csv", root)));
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /header mismatch|code fence|duplicate keyword|volume=0/i);
});

test("prompts.csv valid fixture passes", () => {
  const result = validatePromptsCsv(readText(new URL("prompts.valid.csv", root)));
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("prompts.csv invalid fixture fails on short prompt and invalid engine", () => {
  const result = validatePromptsCsv(readText(new URL("prompts.invalid.csv", root)));
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /at least 5 words|invalid value|too vague/i);
});

test("plan.csv valid fixture passes with cross references", () => {
  const result = validatePlanCsv(readText(new URL("plan.valid.csv", root)), {
    keywordsText: readText(new URL("keywords.refs.csv", root)),
    promptsText: readText(new URL("prompts.refs.csv", root)),
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("plan.csv invalid fixture fails on missing references and bad subsection", () => {
  const result = validatePlanCsv(readText(new URL("plan.invalid.csv", root)), {
    keywordsText: readText(new URL("keywords.refs.csv", root)),
    promptsText: readText(new URL("prompts.refs.csv", root)),
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /subsection must be empty|not found in keywords\.csv|not found in prompts\.csv|why_it_matters/i);
});
