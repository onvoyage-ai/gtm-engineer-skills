import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  aggregateChecks,
  buildCoverage,
  buildIntelligenceSignals,
  buildPrioritizedFixes,
  extractAiView,
  isLlmsTxtValid,
  letterGrade,
  scorePageChecks,
} from "../../audit-website-aeo/scripts/aeo-audit.mjs";

const fixtureRoot = new URL("../fixtures/audit-site/", import.meta.url);
const pageFixtures = [
  { file: "index.html", url: "https://fixture.example/" },
  { file: "guide.html", url: "https://fixture.example/guide" },
  { file: "product.html", url: "https://fixture.example/product" },
];

test("aeo-audit deterministic scoring stays stable on the local fixture set", () => {
  const pageAudits = pageFixtures.map(({ file, url }) => {
    const html = readFixture(file);
    const aiView = extractAiView(html, new URL(url));
    const { checks, score, maxScore } = scorePageChecks(aiView);
    return {
      url,
      pageType: url.endsWith("/guide") ? "docs" : url.endsWith("/product") ? "product" : "home",
      aiView,
      checks,
      score,
      maxScore,
    };
  });

  const checks = aggregateChecks(pageAudits);
  const llmsText = readFixture("llms.txt");
  const llmsValid = isLlmsTxtValid({
    found: true,
    hasH1: /^#\s+.+/m.test(llmsText),
    hasLink: /\[.+?\]\(.+?\)/.test(llmsText),
    contentLength: llmsText.trim().length,
  });

  checks.push({
    id: "llms-txt",
    label: "llms.txt valid",
    passed: llmsValid,
    points: 10,
    details: "Fixture llms.txt is valid.",
  });
  checks.push({
    id: "ai-bot-access",
    label: "AI bot access",
    passed: true,
    points: 12,
    details: "Fixture robots.txt allows all major AI crawlers.",
  });
  checks.push({
    id: "rss-feed",
    label: "RSS/Atom feed",
    passed: true,
    points: 8,
    details: "Fixture feed.xml is present.",
  });

  const coverage = buildCoverage(pageAudits);
  const prioritizedFixes = buildPrioritizedFixes(checks, coverage, llmsValid, []);
  const intelligenceSignals = buildIntelligenceSignals({
    pageAudits,
    coverage,
    blockedBots: [],
    rssFeedFound: true,
    discoveredFromSitemap: 3,
    failedPages: 0,
    maxPages: 3,
  });

  const earnedPoints = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);
  const maxPoints = checks.reduce((sum, check) => sum + check.points, 0);
  const foundationalScore = Math.round((earnedPoints / maxPoints) * 100);
  const heuristicIntelligenceScore = Math.round(
    intelligenceSignals.reduce((sum, signal) => sum + signal.score, 0) / intelligenceSignals.length
  );
  const provisionalScore = Math.round(0.5 * foundationalScore + 0.5 * heuristicIntelligenceScore);

  assert.equal(pageAudits.length, 3);
  assert.equal(foundationalScore, 100);
  assert.equal(llmsValid, true);
  assert.equal(prioritizedFixes.length, 0);
  assert.equal(letterGrade(provisionalScore), "B+");

  const checksById = new Map(checks.map((check) => [check.id, check]));
  assert.equal(checksById.get("title")?.passed, true);
  assert.equal(checksById.get("schema-types")?.passed, true);
  assert.equal(checksById.get("llms-txt")?.passed, true);
  assert.equal(checksById.get("ai-bot-access")?.passed, true);
  assert.equal(checksById.get("rss-feed")?.passed, true);

  assert.ok(intelligenceSignals.every((signal) => signal.score >= 50));
});

function readFixture(file) {
  return readFileSync(new URL(file, fixtureRoot), "utf8");
}
