import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  extractAiView,
  isPathAllowed,
  parseRobotsTxt,
  ruleMatches,
  scorePageChecks,
} from "./aeo-audit.mjs";

function repeatedWords(count) {
  return Array.from({ length: count }, (_, i) => `content${i}`).join(" ");
}

describe("JSON-LD extraction", () => {
  it("recognizes schema types from JSON-LD arrays and graph containers", () => {
    const html = `<!doctype html>
      <html>
        <head>
          <title>Acme Product Intelligence Platform</title>
          <meta name="description" content="Acme helps product teams understand customer signals with clear research workflows and trusted evidence.">
          <link rel="canonical" href="https://example.com/product">
          <meta property="og:title" content="Acme Product Intelligence Platform">
          <meta property="og:description" content="Research workflows and trusted evidence for product teams.">
          <script type="application/ld+json">
            [
              {"@context":"https://schema.org","@type":"Organization","name":"Acme"},
              {"@context":"https://schema.org","@graph":[
                {"@type":"WebSite","name":"Acme"},
                {"@type":"https://schema.org/Product","name":"Acme Signals"}
              ]}
            ]
          </script>
        </head>
        <body>
          <main>
            <h1>Acme Product Intelligence</h1>
            <h2>Overview</h2>
            <p>${repeatedWords(260)}</p>
          </main>
        </body>
      </html>`;

    const aiView = extractAiView(html, new URL("https://example.com/product"));
    assert.deepEqual(aiView.schemaTypes.sort(), ["Organization", "Product", "WebSite"]);

    const schemaTypesCheck = scorePageChecks(aiView).checks.find((c) => c.id === "schema-types");
    assert.equal(schemaTypesCheck?.passed, true);
    assert.match(schemaTypesCheck?.details || "", /Organization/);
    assert.match(schemaTypesCheck?.details || "", /Product/);
  });
});

describe("robots.txt parsing", () => {
  it("applies rules to every user-agent in a multi-agent group", () => {
    const policy = parseRobotsTxt(`
      User-agent: GPTBot
      User-agent: ClaudeBot
      Disallow: /

      User-agent: *
      Allow: /
      Sitemap: https://example.com/sitemap.xml
    `, new URL("https://example.com"));

    assert.deepEqual(policy.aiBotBlocked.sort(), ["claudebot", "gptbot"]);
    assert.deepEqual(policy.allow, ["/"]);
    assert.deepEqual(policy.disallow, []);
    assert.deepEqual(policy.sitemapUrls, ["https://example.com/sitemap.xml"]);
  });

  it("uses the wildcard group for AI bots without more specific rules", () => {
    const policy = parseRobotsTxt(`
      User-agent: *
      Disallow: /

      User-agent: GPTBot
      Allow: /
    `, new URL("https://example.com"));

    assert.equal(policy.aiBotBlocked.includes("gptbot"), false);
    assert.equal(policy.aiBotBlocked.includes("claudebot"), true);
    assert.equal(policy.aiBotBlocked.includes("perplexitybot"), true);
  });

  it("supports wildcard and end-anchor matching with allow precedence", () => {
    assert.equal(ruleMatches("/docs/page.html", "/*.html$"), true);
    assert.equal(ruleMatches("/docs/page.html/more", "/*.html$"), false);

    const policy = { allow: ["/private/public"], disallow: ["/private"] };
    assert.equal(isPathAllowed("/private/public", policy), true);
    assert.equal(isPathAllowed("/private/secret", policy), false);
  });
});
