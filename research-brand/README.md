# Research Brand DNA

Generate a complete Brand DNA file from a URL. Crawls the website, searches the web, identifies competitors, and produces a structured `brand_dna.md` ready for content strategy, SEO, and GEO work.

## What It Does

Give it a URL → get a full brand intelligence file:
- What the product does (in plain language, not marketing fluff)
- Key features, pricing, target customer
- 3-5 competitors with overlap analysis
- Brand voice and positioning
- Content gaps and next-step recommendations

## Install

```bash
curl -s https://raw.githubusercontent.com/onvoyage-ai/gtm-engineer-skills/main/research-brand/skill.md \
  | claude skill add --name "research-brand" --from -
```

## Usage

```
/research-brand https://www.example.com
```

## Output

A `brand_dna.md` file saved to your project directory. Feeds directly into:
- **research-keywords** — SEO keyword research
- **geo-content-research** — GEO prompt targets
- **improve-aeo-geo** — AEO/GEO website audit
