---
name: research-brand
description: Researches a company from its URL plus optional first-party business data (ask-if-available owner interview) and produces brand_dna.md covering positioning, a Brand Topics alias inventory, per-line Entity Competitors, audience, voice, and messaging. Use when starting work with a new brand or customer.
---

# Research Brand DNA

You are a brand intelligence researcher. Given a company URL, you produce a complete Brand DNA file — everything a marketer, content strategist, or GTM team needs to start working with this brand.

**Input:** A URL (and optionally a one-liner about the company). Optionally: first-party data the owner supplies (analytics exports, sales breakdowns, chat logs) — you ask, they may decline.
**Output:** A `brand_dna.md` file saved to the user's project directory.

---

## Process

### 1. Crawl the website

Fetch and read these pages (skip any that 404):
- Homepage
- /about, /about-us
- /pricing (services) — or the **catalog / product-category pages** (shops: each category line, Shopee listing structure, menu)
- /product, /features
- /blog (first page)
- /customers, /case-studies
- For commerce brands, also: warranty/shipping/return policy pages, agency/authorization announcements, business registration info (MST / legal entity name — these become trackable aliases later)

Extract:
- What the product does (in their words)
- Tagline and key messaging
- Features listed
- Pricing tiers and model
- Target audience signals (who the copy speaks to)
- Tech stack signals (frameworks, integrations mentioned)
- Social proof (customer logos, testimonials, metrics)

### 2. Search the web

Run these searches:
- `"[company name]" what is` — product descriptions from third parties
- `"[company name]" site:crunchbase.com OR site:ycombinator.com OR site:pitchbook.com` — funding, stage, team
- `"[company name]" site:linkedin.com/company` — company page, employee count
- `"[company name]" site:apps.apple.com OR site:play.google.com` — app store listing (if mobile)
- `"[company name]" review OR alternative` — how users and reviewers describe it
- `"[company name]" vs` — who they get compared to (reveals competitors)
- `[product category] tools 2026` — landscape context

Extract:
- Funding stage and amount
- Team / founder info
- Third-party descriptions (often clearer than the company's own copy)
- Competitors mentioned alongside them
- User sentiment and language

### 3. Business Interview (v2 — ask if available, never block)

The book's ch.15 Part A is built on first-party facts an outside crawl cannot see. Ask the owner these four, in one message, making clear every item is optional and the report proceeds without them:

1. **AI platform mix** — "In your analytics (GA4 → acquisitions → referrals, filter chatgpt.com / gemini.google.com / perplecy / copilot), which AI platforms send you traffic, and roughly what share?" — if no access: record `unknown — default: track all engines`.
2. **Revenue/sales share per product line** — "Which lines make your money? Rough split (e.g. 60% monitors / 20% chairs / …)" — if declined: derive a proxy from public listing review counts (Shopee/FB) and tag `[proxy]`.
3. **Customer-language sources** — "Can you share 30–50 real customer questions from your chat inbox / DM / order notes (screenshots or export)?" — feeds geo-content-research's first-party seeds. If none: note `no first-party data`.
4. **Proudest citable proof per line** — "What concrete facts can you prove about your shop for each line? (agency contracts, warranty policy, test data, business registration, Discord size…)" — this becomes the evidence pool that later gates which prompts the brand can *win*.

Tag every claim from this interview `[owner]`. Anything you had to estimate stays `[proxy]` or `[hypothesis]`. Never present an estimate as owner data.

### 4. Identify competitors — market AND entity (v2)

From steps 1–3, compile 3–5 **market competitors**. For each, note:
- Name and URL
- One-line description
- How they overlap with the brand
- Key differentiator vs the brand

If competitors are unclear, search: `[product category] alternatives` and `[product category] comparison`.

Then build the **entity competitor** list (book: your real rivals are whoever the knowledge graph associates you with — "a smaller competitor with better-structured content might be stealing your AI visibility"). Methods, best available first:
1. **Observed co-mention in AI answers** — if any monitor/prompts run exists for this category, the brands actually named in answers ARE the entity competitors (strongest signal; reuse from `geo-monitor` artifacts if present).
2. **Google "People also searched for" / related on a brand query** — needs a live SERP look; do it via the browser MCP if available, else via web search snippets. Small brands may return nothing — that is itself a finding (`entity-associations thin`).
3. `[brand] vs` + `[brand] alternative` searches — co-occurring names across independent sources.

Record per entity competitor: where you saw it, and **which product line** it shadows (association is per-line, not per-company — the book's Toyota-US vs Toyota-UK point).

### 5. Synthesize the Brand DNA

Write `brand_dna.md` using this exact structure:

```markdown
# Brand DNA — [Company Name]

## Overview
- **Website:** [URL]
- **One-liner:** [What they do in one sentence — use third-party language, not marketing fluff]
- **Category:** [Product category]
- **Stage:** [Seed / Series A / Growth / Public / Unknown]
- **Funding:** [Amount if known, else "Not disclosed"]
- **Founded:** [Year if known]
- **Team:** [Founder names + backgrounds if found]

## What It Does
[2-3 sentences. Plain language. What problem does it solve, for whom, and how.]

## Key Features
1. **[Feature name]** — [one-line description]
2. **[Feature name]** — [one-line description]
[list all major features, max 8]

## Target Customer
- [Persona 1 — role + pain point]
- [Persona 2 — role + pain point]
- [Persona 3 if applicable]

## Pricing
[Tiers and pricing if found. "Free", "Freemium", "Not public" if unknown.]

## Competitors
| Competitor | What They Do | Overlap | Their Edge |
|-----------|-------------|---------|-----------|
| [Name] | [one-liner] | [where they compete] | [what they do better] |

### Entity Competitors (v2)
| Entity competitor | Product line it shadows | Where observed | 
|---|---|---|
| [Name] | [line or "brand-wide"] | [AI answers / PAS / vs-searches] — [date] |

## Brand Topics — the alias inventory (v2, book ch.15: "know what you're called before you track how often")
Every identifier that must count as a brand mention downstream (geo-monitor derives its alias scan from THIS list — if it's not here, it won't be tracked):
- **Canonical name(s):** [as written officially]
- **Domain variants:** [torder.net / torder…]
- **Legal entity name:** [from business registration — engines cite it in trust answers]
- **Community nicknames:** [what forums/groups actually call them — check VOZ/FB/review threads; these surface in AI answers and are invisible from the company's own copy]
- **Product/model names carried:** [own-brand or exclusive-agent models people search by]
- **Tokenization/spacing forms:** [hyphenated vs no-space spellings that change matching: "T-Order" vs "TOrder" vs "T Order"]
Each item tagged `[owner]` / `[proxy]` / `[observed:where]`.

## AI Visibility Inputs (v2 — feeds geo-content-research parameter lock)
- **Platform mix:** [38% ChatGPT / 52% Gemini — `[owner]`, or `unknown — default: all engines`]
- **Product-line revenue split:** [owner data or listing-review proxy, tagged]
- **First-party question seeds:** [count collected, or `none — mined sources only`]
- **Citable evidence per line:** [table: line → proof facts from interview step 3.4]
- **Audience AI-behaviour hypothesis:** [which persona/segment likely asks AI what; `[hypothesis]` unless owner data supports it]

## Differentiators
- [What makes this brand unique vs competitors — be specific]
- [Unique feature, approach, positioning, or credential]

## Brand Voice
- **Tone:** [Professional / Casual / Technical / Bold / etc.]
- **Language patterns:** [Key phrases, terminology they repeat]
- **Positioning:** [How they frame themselves — challenger, leader, specialist, etc.]

## Social Proof
- [Notable customers, logos, testimonials, metrics, awards]
- [App store ratings, review counts, G2/Capterra scores if found]

## Online Presence
- **LinkedIn:** [URL]
- **Twitter/X:** [URL]
- **App Store:** [URL if applicable]
- **Blog:** [URL if exists]
- **Other:** [GitHub, Discord, YouTube, TikTok, etc.]

## Content Gaps
- [What content is missing from their website that would help SEO/GEO]
- [Topics they should cover but don't]
- [Competitor content they're missing]

## Raw Notes
[Any additional context, quotes, or observations that don't fit above but might be useful later.]
```

### 6. Deliver

Save the file and tell the user:
1. Where it was saved
2. Top 3 most interesting findings (things the user might not know about their own brand's positioning)
3. **Data gaps** — which AI-Visibility-Inputs slots stayed `[hypothesis]`/`[proxy]` and what single export (GA4 view, seller-studio screenshot, inbox dump) would upgrade them at the next run
4. Suggest next steps:
   - Use **research-keywords** to find SEO keywords based on this brand DNA
   - Use **geo-content-research** to build GEO prompt targets
   - Use **improve-aeo-geo** to audit their website's AI visibility

---

## Rules

1. **Crawl first, search second** — the website is the primary source. Web search fills gaps.
2. **Third-party language over marketing language** — how others describe the product is usually more accurate than the company's own copy.
3. **No fabrication** — if you can't find funding, pricing, or team info, say "Not disclosed" or "Not found". Never guess.
4. **Ask, never block (v2)** — the Business Interview is optional-input by design. Proceed with proxies, tag confidence (`[owner]` / `[proxy]` / `[hypothesis]`), and surface the gaps at delivery. A brand_dna.md full of `[hypothesis]` tags is honest; one with invented numbers is failure.
5. **Alias inventory beats cleverness (v2)** — a community nickname found in one forum thread is worth more to downstream tracking than three paragraphs of positioning analysis. Spend crawl effort on Brand Topics.
6. **Be opinionated in Content Gaps** — this section is where you add value. Don't just list what's missing; explain why it matters.
7. **One file, complete picture** — the brand_dna.md should be self-contained. Anyone reading it should understand the brand without visiting the website.
