# GEO Content Research & Generation

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill that reverse-engineers how AI engines evaluate your product category, then generates the exact content structure needed to get your brand cited in ChatGPT, Gemini, and Perplexity answers.

**No paid ads. No social media required. No bidding war.**

AI engines have no paid ranking. ChatGPT recommendations are earned — through content quality, data structure, and source authority. This skill builds all three.

---

## Install

```bash
claude skill add --from https://github.com/onvoyage-ai/gtm-engineer-skills/geo-content-research
```

Or manually copy `skill.md` into your project's `.claude/skills/` directory.

## Usage

```
/geo-content-research
```

Or:
> "Use the GEO research skill to help me get my brand into AI recommendations"
> "Run GEO content research for my [product category]"

The skill is **interactive** — it asks you questions and waits for answers at each phase. It does not generate content without completing research first.

---

## The 6-Phase Process

### Phase 1: Product Intelligence
The skill interviews you about your product, category, competitors, and existing content. Builds the context needed for all research phases.

### Phase 2: AI Prompt Research
Discovers the exact queries people type into AI chatbots about your category:
- Maps questions across 8 query types (definition, recommendation, comparison, evaluation, how-to, cost, landscape, use case)
- Mines Reddit for real user language and pain points
- Identifies 8-12 criteria AI uses to recommend products
- Finds 10-15 trusted sources AI cites in your niche

This is the "algorithm blueprint" — you get to see what AI looks for before writing a word.

### Phase 3: GEO Prompt Target Table
**The primary research deliverable.** Takes the raw prompts from Phase 2, deduplicates, scores, and produces a prioritized table:
- Every prompt tagged by business-value tier: Buy, Solve, or Learn
- Scored by citability and competition level
- Each prompt includes a specific mechanism for how the brand gets mentioned in AI answers
- Sorted by priority: Easy Wins first, then Targets

### Phase 4: Content Blueprint
Designs the exact pages to build, in priority order. Every page is mapped to a specific query type AI will match it to:

| Page Type | Purpose |
|---|---|
| Category Guide | Owns "how to choose X" queries |
| Comparison Hub | Owns "best X" and "X vs Y" queries |
| Data & Evidence Page | Provides verifiable data AI can cite |
| Use Case Pages | Owns "X for [specific situation]" queries |
| Myth-Busting Page | Captures doubt/trust queries near purchase |
| Glossary / Technical Reference | Becomes the definition source AI cites |

### Phase 5: Content Generation
Writes each page with the 5 AI-ready zones every page must have:

| Zone | Purpose |
|---|---|
| Direct Answer Block | 40-60 words AI extracts verbatim to answer queries |
| Comparison Table | Structured data AI uses for "which is better" answers |
| Data & Evidence Section | Cited statistics that make AI trust your content |
| Scenario Solutions | "X for [situation]" coverage |
| FAQ Section | Targets "People Also Ask" with FAQPage schema |

Every page includes the appropriate structured data (Product, FAQPage, HowTo, ClaimReview, Comparison JSON-LD).

### Phase 6: Authority Infiltration Plan
Builds off-site signals that make AI engines trust your website as a primary source:
- Quora answer strategy (ChatGPT crawls Quora heavily)
- Reddit data-posting approach (data only, no links in posts)
- Medium deep-analysis article structure
- Wikipedia eligibility assessment
- Industry forum authority-building plan

---

## Why This Works

Traditional traffic is **pull** — users must already know to search for you.

AI traffic is **push** — a user asks "what's the best water purifier?" and AI actively recommends your brand. The user never opens Google.

The snowball effect:
1. ChatGPT recommends your brand → user shares screenshot on Reddit
2. Reddit discussion is crawled by Claude
3. Claude cites your data page
4. Perplexity references Claude's sources
5. Your brand appears in every AI answer in the category

Being cited once leads to being cited everywhere — because AI engines cite each other's cited sources.

---

## How This Differs From the AEO/GEO Skill

| Skill | Focus |
|---|---|
| `improve-aeo-geo` | Technical website fixes — robots.txt, structured data, meta tags, heading hierarchy |
| `geo-content-research` | Research + content strategy — what to write and how to structure it so AI recommends you |

**Use both**: fix your technical foundation first (`improve-aeo-geo`), then build your content authority (`geo-content-research`).

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](../LICENSE).
