import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const scriptRoot = new URL("../../research-keywords/scripts/", import.meta.url);
const cliCwd = mkdtempSync(join(tmpdir(), "research-keywords-cli-"));
after(() => rmSync(cliCwd, { recursive: true }));
const keyword = {
  name: "keyword-explorer",
  path: fileURLToPath(new URL("keyword-explorer.mjs", scriptRoot)),
  valued: ["--seeds", "-s", "--out", "-o", "--gl", "--hl", "--depth", "-d"],
  recognized: ["--seeds", "-s", "--out", "-o", "--gl", "--hl", "--depth", "-d", "--free", "--help", "-h"],
};
const serp = {
  name: "serp-analyzer",
  path: fileURLToPath(new URL("serp-analyzer.mjs", scriptRoot)),
  valued: ["--input", "-i", "--keywords", "-k", "--top", "-t", "--track", "--out", "-o", "--gl", "--hl"],
  recognized: ["--input", "-i", "--keywords", "-k", "--top", "-t", "--track", "--out", "-o", "--gl", "--hl", "--help", "-h"],
};
const clis = [keyword, serp];
const keywordDefaults = { seeds: ["alpha"], free: false, out: null, gl: "us", hl: "en", depth: "normal" };
const serpDefaults = { input: null, keywords: ["alpha"], top: 10, track: [], out: null, gl: "us", hl: "en" };
const keywordFreeMessages = [
  "No SERPAPI_KEY found. Falling back to free mode (autocomplete only).",
  "Set SERPAPI_KEY env var for full features (PAA, Related Searches, SERP features).\n",
];
const serpKeyMessages = [
  "Error: SERPAPI_KEY environment variable is required.",
  "Get a free key at https://serpapi.com (100 searches/month).",
];

function runCli(cli, args) {
  const result = spawnSync(process.execPath, [cli.path, ...args], {
    cwd: cliCwd,
    env: {},
    encoding: "utf8",
    timeout: 5000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return result;
}

function assertMissing(result, flag) {
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "Error: Missing value for " + flag + ". Use --help for usage.\n");
}

for (const cli of clis) {
  for (const flag of cli.valued) {
    test(cli.name + " missing terminal " + flag, () => {
      assertMissing(runCli(cli, [flag]), flag);
    });
    for (const next of cli.recognized) {
      test(cli.name + " missing " + flag + " before " + next, () => {
        assertMissing(runCli(cli, [flag, next, "--help", "--help"]), flag);
      });
    }
  }
}

function extractParser(source) {
  const imports = [...source.matchAll(/^import .+;$/gm)];
  const help = [...source.matchAll(/^function printHelp\(\) \{$/gm)];
  assert.equal(imports.length, 3);
  assert.equal(help.length, 1);
  assert.equal(source.indexOf(imports[2][0]), imports[2].index);
  assert.equal(source.lastIndexOf(imports[2][0]), imports[2].index);
  const start = imports[2].index + imports[2][0].length;
  const end = help[0].index;
  assert.ok(start < end);
  const region = source.slice(start, end);
  assert.equal([...region.matchAll(/^function parseArgs\(\) \{$/gm)].length, 1);
  assert.doesNotMatch(region, /\b(?:import|require|https|fetch|fs|main)\s*(?:[.(]|\()/);
  return region;
}

function parserSource(cli) {
  return extractParser(readFileSync(cli.path, "utf8"));
}

function observeParser(cli, args, key = "offline-fixture") {
  const logs = [];
  const errors = [];
  const exit = Object.freeze({});
  const observation = { status: null, help: 0, opts: null, logs, errors };
  const sandbox = {
    process: {
      argv: ["node", cli.path, ...args],
      env: { SERPAPI_KEY: key },
      exit: (status) => {
        observation.status = status;
        throw exit;
      },
    },
    console: {
      log: (message) => logs.push(message),
      error: (message) => errors.push(message),
    },
    printHelp: () => { observation.help += 1; },
  };
  try {
    observation.opts = runInNewContext(parserSource(cli) + "\nparseArgs();", sandbox, {
      timeout: 1000,
      contextCodeGeneration: { strings: false, wasm: false },
    });
  } catch (error) {
    assert.equal(error, exit);
  }
  return observation;
}

function assertOpts(cli, args, expected, key = "offline-fixture", logs = []) {
  const result = observeParser(cli, args, key);
  assert.equal(result.status, null);
  assert.equal(result.help, 0);
  assert.deepEqual(structuredClone(result.opts), expected);
  assert.deepEqual(result.logs, logs);
  assert.deepEqual(result.errors, []);
}

test("keyword complete long options preserve conversions", () => {
  assertOpts(keyword, ["--seeds", " Alpha , Beta ", "--out", "-keywords.json", "--gl", "in", "--hl", "hi", "--depth", "deep", "--free"], {
    seeds: ["Alpha", "Beta"], free: true, out: "-keywords.json", gl: "in", hl: "hi", depth: "deep",
  });
});

test("SERP complete long options preserve conversions and input precedence", () => {
  assertOpts(serp, ["--input", "-input.json", "--keywords", " Alpha , Beta ", "--top", "-2", "--track", " EXAMPLE.COM , Sub.Example.COM ", "--out", "--serp.json", "--gl", "in", "--hl", "hi"], {
    input: "-input.json", keywords: ["Alpha", "Beta"], top: -2, track: ["example.com", "sub.example.com"], out: "--serp.json", gl: "in", hl: "hi",
  });
});

test("keyword all short aliases and mixed order", () => {
  assertOpts(keyword, ["-o", "./--help", "--hl", "fr", "-d", "quick", "-s", "alpha,beta", "--gl", "ca"], {
    seeds: ["alpha", "beta"], free: false, out: "./--help", gl: "ca", hl: "fr", depth: "quick",
  });
});

test("SERP all short aliases and mixed order", () => {
  assertOpts(serp, ["-o", "./--help", "-t", "-1.5", "-k", "alpha,beta", "--hl", "fr", "-i", "-input.json", "--gl", "ca", "--track", " EXAMPLE.COM "], {
    input: "-input.json", keywords: ["alpha", "beta"], top: -1, track: ["example.com"], out: "./--help", gl: "ca", hl: "fr",
  });
});

test("keyword defaults", () => {
  assertOpts(keyword, ["--seeds", "alpha"], keywordDefaults);
});
test("SERP defaults", () => {
  assertOpts(serp, ["--keywords", "alpha"], serpDefaults);
});
test("SERP input-only defaults", () => {
  assertOpts(serp, ["--input", "file.json"], { ...serpDefaults, input: "file.json", keywords: [] });
});
test("keyword repeated values use last assignment", () => {
  assertOpts(keyword, ["--seeds", "old", "-s", "alpha", "--out", "old.json", "-o", "new.json", "--gl", "gb", "--gl", "us", "--hl", "fr", "--hl", "en", "--depth", "deep", "-d", "normal"], {
    ...keywordDefaults, out: "new.json",
  });
});
test("SERP repeated values use last assignment", () => {
  assertOpts(serp, ["--input", "old.json", "-i", "new.json", "--keywords", "old", "-k", "alpha", "--top", "2", "-t", "10", "--track", "old.com", "--track", "NEW.COM", "--out", "old.json", "-o", "new-out.json", "--gl", "gb", "--gl", "us", "--hl", "fr", "--hl", "en"], {
    ...serpDefaults, input: "new.json", track: ["new.com"], out: "new-out.json",
  });
});

for (const args of [["--free", "--seeds", "alpha"], ["--seeds", "alpha", "--free"], ["--free", "--seeds", "alpha", "--free"]]) {
  test("keyword free boolean order " + JSON.stringify(args), () => {
    assertOpts(keyword, args, { ...keywordDefaults, free: true }, "");
  });
}

for (const value of ["", " ", " alpha , , beta, "]) {
  const expected = { "": [""], " ": [""], " alpha , , beta, ": ["alpha", "", "beta", ""] };
  test("keyword preserves supplied list " + JSON.stringify(value), () => {
    assertOpts(keyword, ["--seeds", value], { ...keywordDefaults, seeds: expected[value] });
  });
  test("SERP preserves supplied lists " + JSON.stringify(value), () => {
    assertOpts(serp, ["--keywords", value, "--track", value], { ...serpDefaults, keywords: expected[value], track: expected[value] });
  });
}

test("SERP tracking lowercases and preserves empty elements", () => {
  assertOpts(serp, ["--keywords", "alpha", "--track", " EXAMPLE.COM , , Sub.Example.COM, "], {
    ...serpDefaults, track: ["example.com", "", "sub.example.com", ""],
  });
});
test("keyword scalar empty values", () => {
  assertOpts(keyword, ["--seeds", "alpha", "--out", "", "--gl", " ", "--hl", "", "--depth", ""], {
    ...keywordDefaults, out: "", gl: " ", hl: "", depth: "",
  });
});
test("SERP scalar empty values", () => {
  assertOpts(serp, ["--keywords", "alpha", "--input", "", "--out", "", "--gl", " ", "--hl", ""], {
    ...serpDefaults, input: "", out: "", gl: " ", hl: "",
  });
});

for (const [value, expected] of [["0", 0], ["-2", -2], ["-1.5", -1], ["2.9", 2], ["", NaN], ["garbage", NaN], ["0x10", 0]]) {
  test("SERP integer coercion " + JSON.stringify(value), () => {
    assertOpts(serp, ["--keywords", "alpha", "--top", value], { ...serpDefaults, top: expected });
  });
}

test("keyword dash values and other CLI options remain data", () => {
  assertOpts(keyword, ["--seeds", "-alpha", "--out", "--report.json", "--gl", "--input", "--hl", "--top", "--depth", "--track"], {
    seeds: ["-alpha"], free: false, out: "--report.json", gl: "--input", hl: "--top", depth: "--track",
  });
});
test("SERP dash values and other CLI options remain data", () => {
  assertOpts(serp, ["--input", "-input.json", "--keywords", "--seeds", "--out", "-report.json", "--track", "--free", "--gl", "--depth", "--hl", "-d"], {
    ...serpDefaults, input: "-input.json", keywords: ["--seeds"], out: "-report.json", track: ["--free"], gl: "--depth", hl: "-d",
  });
});
test("keyword standalone unknown options remain ignored", () => {
  assertOpts(keyword, ["--seeds", "alpha", "--unknown", "--", "--seeds=beta", "-sd", "ignored"], keywordDefaults);
});
test("SERP standalone unknown options remain ignored", () => {
  assertOpts(serp, ["--keywords", "alpha", "--unknown", "--", "--keywords=beta", "-kt", "ignored"], serpDefaults);
});

function assertExit(cli, args, key, status, errors, help = 0) {
  const result = observeParser(cli, args, key);
  assert.equal(result.status, status);
  assert.equal(result.opts, null);
  assert.equal(result.help, help);
  assert.deepEqual(result.errors, errors);
  assert.deepEqual(result.logs, []);
}

test("keyword requires seeds before selecting free mode", () => {
  assertExit(keyword, [], "", 1, ["Error: --seeds is required. Use --help for usage."]);
});
test("keyword missing key retains automatic free mode", () => {
  assertOpts(keyword, ["--seeds", "alpha"], { ...keywordDefaults, free: true }, "", keywordFreeMessages);
});
test("SERP key validation precedes required input validation", () => {
  assertExit(serp, [], "", 1, serpKeyMessages);
});
test("SERP rejects valid keywords when key is missing", () => {
  assertExit(serp, ["--keywords", "alpha"], "", 1, serpKeyMessages);
});
test("SERP requires input or keywords with fixture key", () => {
  assertExit(serp, [], "offline-fixture", 1, ["Error: --input or --keywords is required. Use --help for usage."]);
});

for (const cli of clis) {
  for (const help of ["--help", "-h"]) {
    test(cli.name + " help wins before malformed argument " + help, () => {
      const result = runCli(cli, [help, cli.valued[0]]);
      assert.equal(result.status, 0);
      assert.equal(result.stderr, "");
      assert.ok(result.stdout.includes("Usage:"));
      assertExit(cli, [help, cli.valued[0]], "", 0, [], 1);
    });
    test(cli.name + " valid value before help " + help, () => {
      const result = runCli(cli, [cli.valued[0], "alpha", help]);
      assert.equal(result.status, 0);
      assert.equal(result.stderr, "");
      assert.ok(result.stdout.includes("Usage:"));
      assertExit(cli, [cli.valued[0], "alpha", help], "", 0, [], 1);
    });
  }
}

test("missing value precedes credentials and earlier valid assignments", () => {
  assertExit(serp, ["--keywords", "alpha", "--top"], "", 1, ["Error: Missing value for --top. Use --help for usage."]);
  assertExit(keyword, ["--seeds", "alpha", "--out", "--help"], "", 1, ["Error: Missing value for --out. Use --help for usage."]);
});

test("VM source boundary checks reject missing or duplicated boundaries", () => {
  const source = readFileSync(keyword.path, "utf8");
  assert.throws(() => extractParser(source.replace("function printHelp() {", "function changedHelp() {")));
  assert.throws(() => extractParser(source + "\nfunction printHelp() {\n}"));
  assert.throws(() => extractParser(source + '\nimport { URL, URLSearchParams } from "url";'));
});
