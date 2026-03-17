---
name: create-geo-charts
description: Creates data visualizations (charts, graphs, tables) optimized for AI engine parsing and citation. Produces inline SVG/HTML with text summaries, data tables, and JSON-LD so AI engines can quote the data.
---

# Create GEO/SEO Charts & Data Visualizations

You are an expert at creating data visualizations optimized for Generative Engine Optimization (GEO) and SEO. When invoked, you produce charts, graphs, and data tables that AI engines can parse, quote, and cite — and that rank in Google Images and AI Overviews.

Core insight: AI engines cite text, not pixels. Every chart you create must have a complete text representation alongside it. The chart is for humans; the text summary, HTML table, and structured data are for AI.

## Workflow

### Step 1: Understand the Data

Ask the user for:
1. **Data source** — raw data, research findings, or a synthesis request
2. **Chart purpose** — what point should the chart make?
3. **Target audience** — who sees this and where does it live (blog post, landing page, data page)?
4. **Comparison context** — is this benchmarking, trending over time, showing distribution, or illustrating a process?

If the user provides raw data, use it directly. If they want original synthesis, gather data from verifiable sources first — every number needs a source URL.

### Step 2: Choose the Right Chart Type

Match chart type to data and GEO intent:

| Data Pattern | Chart Type | GEO Value |
|---|---|---|
| X vs Y vs Z performance | Comparison bar chart | Very High — answers "which is better" queries |
| Rankings or scores | Horizontal bar chart | Very High — AI extracts ranked lists |
| Changes over time | Line chart | High — answers "how has X changed" queries |
| Part-of-whole | Donut/pie chart (max 5 segments) | Medium — keep segments few and labeled |
| Multi-criteria evaluation | Radar/spider chart | Medium — pair with a comparison table |
| Process or decision | Flowchart / decision tree | High — answers "how does X work" queries |
| Feature comparison | Matrix/checklist table | Very High — direct extraction by AI |

Prefer comparison charts, benchmark tables, and step-by-step flow diagrams — these are the most-cited visual formats by AI engines.

### Step 3: Create the Chart

Generate the visualization using one of these approaches:
- **Inline SVG** (preferred) — text stays crawlable, scales perfectly, accessible
- **Mermaid diagram** — for flowcharts and decision trees in Markdown-based sites
- **Chart.js / D3 config** — for interactive charts, provide the config code
- **Static image** — export as WebP (complex visuals) or SVG (diagrams), compressed

#### SVG Rules
- Use `<text>` elements for all labels — never bake text into paths
- Add `role="img"` and `aria-labelledby="titleID descID"` to root `<svg>`
- Include `<title>` and `<desc>` elements inside the SVG
- Inline the SVG in HTML (not via `<img src>`) so text remains crawlable
- Minimum 3:1 contrast ratio for chart elements, 4.5:1 for text
- Never use color alone to convey meaning — add patterns, labels, or icons

#### Design System — Consulting-Grade Visual Standards

Follow the design principles used by McKinsey, BCG, Deloitte Insights, and Pew Research Center. These firms set the gold standard for credible data visualization.

**Core principle: Restrained elegance. Every element earns its place or gets removed.**

##### Color Palette — Maximum 3 Colors Per Chart

Use one accent color for the key data point. Everything else is neutral gray. Color creates hierarchy, not decoration.

```
Primary accent:  #2563EB  (blue — key insight, #1 data point)
Secondary data:  #64748B  (slate gray — supporting data)
Tertiary data:   #CBD5E1  (light gray — background/context data)
Negative/risk:   #DC2626  (red — only for negative values or warnings)
Positive/growth: #059669  (green — only for positive change indicators)
Background:      #FFFFFF  (white — never use colored chart backgrounds)
Gridlines:       #F1F5F9  (near-invisible — or remove entirely)
```

Override this palette when the user has brand colors. The accent color should be the brand's primary color; all other bars/lines stay gray.

##### Typography — One Family, Size Creates Hierarchy

```
Font:            system-ui, -apple-system, 'Segoe UI', sans-serif
                 (or the site's body font — never mix font families)

Action title:    18-20px, font-weight 700, color #0F172A
Subtitle/lead:   14-15px, font-weight 400, color #475569
Axis labels:     11-12px, font-weight 400, color #64748B
Data labels:     12-13px, font-weight 600, color #0F172A (on/near bars)
Source citation:  11px, font-weight 400, color #94A3B8
```

##### Layout — Open, Borderless, Generous Whitespace

- **No borders or boxes** around charts. White space separates elements, not lines.
- **No chart background fill** — charts sit directly on the page's white background.
- **Padding**: 40-60px top/bottom, 20-40px sides within the SVG viewBox.
- **Width**: Charts should be 640-800px wide max (optimal reading width).

##### Gridlines — Remove Unless Essential

- When data labels are placed directly on bars/points: **remove gridlines AND the value axis entirely**.
- When data labels would clutter (>10 data points): use faint horizontal gridlines (#F1F5F9, 1px) and keep the value axis.
- **Never use vertical gridlines** on bar charts.
- Axis lines: 1px #E2E8F0 for the baseline only.

##### Labels — Direct, Not Legend

- **Place values directly on or beside each bar/point.** Eliminate the need for readers to look back and forth between legend and data.
- **Legends only when unavoidable** (overlapping lines, many-category pie/donut). When used: bottom-aligned, horizontal, compact.
- **Category labels directly on the axis** — left-aligned for horizontal bars, centered below for vertical bars.

##### Action Titles — State the Insight, Not the Topic

The chart title is a complete sentence stating what the reader should take away. This is the #1 pattern from McKinsey and BCG.

```
BAD:  "Revenue by Region"
BAD:  "GEO Strategy Comparison"
GOOD: "Authoritative Quotations Lift AI Visibility by 41%"
GOOD: "Content Updated Within 3 Months Earns 54% More Citations"
```

##### Annotations — Sparse, Pointed

- At most 1-2 callout annotations per chart, pointing to the key insight.
- Use a thin line (1px #94A3B8) + small text label, not boxes or bubbles.
- If a chart needs many annotations to make sense, simplify the chart instead.

##### Source Citation — Always Present, Never Prominent

Small text below the chart, separated by a thin rule or whitespace:
```
Source: [Organization], [Year]. N=[sample size]. [1-line methodology].
```
This is non-negotiable — it's what separates credible research charts from blog graphics.

##### What NOT to Do

- No 3D effects, gradients, shadows, or rounded bar caps
- No decorative icons or illustrations inside the chart area
- No bright multi-color palettes (rainbow charts destroy credibility)
- No pie charts with >5 segments (use horizontal bar instead)
- No radar/spider charts without a companion comparison table
- No dark/colored backgrounds behind chart areas
- No "Chart 1" or "Figure A" labels — always action titles

### Step 4: Write the Text Layer (Critical for GEO)

Every chart MUST have these text companions — this is what AI actually cites:

#### 4A: Takeaway Heading (H2 or H3)
Put the key finding in the heading. AI engines use headings for passage retrieval.

```
BAD:  <h3>Chart 1: Performance Results</h3>
GOOD: <h3>AI Overviews Cite Top-10 Pages 78% of the Time</h3>
```

#### 4B: Key Finding Summary (40-60 words)
Place immediately above the chart. This is the citable unit.

```
Key finding: [Subject] [verb] [object] by [specific number]. Based on [methodology]
of [sample size] [items] between [date range], [subject] outperformed [comparison]
across [N] of [M] tested criteria. [One sentence of practical implication].
```

Rules:
- No pronouns — name the subject explicitly
- At least 1 specific number
- Stands alone without any surrounding context
- Under 60 words

#### 4C: Source & Methodology Line
Place directly below the chart in small text.

```
Source: [Organization Name], [Year]. [N] [items] analyzed from [date] to [date].
Methodology: [1-sentence description of how data was collected/analyzed].
```

#### 4D: "What This Means" Paragraph (2-3 sentences)
Place after the chart. AI models quote interpretations, not just data.

```
What this means: [Practical interpretation]. For [audience], this suggests [action].
[One comparison or context point with a named source].
```

### Step 5: Create the Data Table

Every chart MUST have a companion HTML data table. AI engines parse tables directly.

```html
<figure>
  <figcaption>Table: [Descriptive title matching the chart]</figcaption>
  <table>
    <caption>[Same descriptive title]</caption>
    <thead>
      <tr>
        <th scope="col">[Dimension]</th>
        <th scope="col">[Metric 1]</th>
        <th scope="col">[Metric 2]</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">[Row label]</th>
        <td>[Value]</td>
        <td>[Value]</td>
      </tr>
    </tbody>
  </table>
</figure>
```

Rules:
- Use `<thead>`, `<tbody>`, `<th scope>`, `<caption>` — full semantic markup
- Values in the table must exactly match the chart
- Include units in column headers, not in each cell
- Offer a downloadable CSV: `<a href="data.csv" download>Download data (CSV)</a>`
- Table should be in the DOM (not lazy-loaded via JS) so crawlers see it

### Step 6: Add Structured Data

Add JSON-LD for the dataset:

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "[Chart title — the takeaway heading]",
  "description": "[Key finding summary from Step 4B]",
  "temporalCoverage": "[Start date]/[End date]",
  "variableMeasured": [
    {
      "@type": "PropertyValue",
      "name": "[Metric name]",
      "unitText": "[Unit]"
    }
  ],
  "creator": {
    "@type": "Organization",
    "name": "[Brand/Author name]"
  },
  "datePublished": "[ISO date]",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "image": {
    "@type": "ImageObject",
    "contentUrl": "[Chart image URL or inline reference]",
    "caption": "[Key finding summary]",
    "encodingFormat": "image/svg+xml"
  },
  "distribution": {
    "@type": "DataDownload",
    "encodingFormat": "text/csv",
    "contentUrl": "[CSV download URL]"
  }
}
```

### Step 7: Image Optimization

**Critical GEO principle: AI engines cite text, not pixels.** The chart image is for human readers. The text summary, HTML data table, and JSON-LD are what AI actually extracts and cites. A chart without its text layer is invisible to LLMs.

Don't add visuals to hit a target count. Add a chart only when it carries data, explains a process, or proves a claim. Decorative graphics add zero GEO value.

For the chart image file itself:

- **Filename**: Descriptive, hyphenated. Example: `ai-overview-citation-rate-by-rank-2025.svg`
- **Alt text**: Describe the **conclusion**, not the visual form. AI models and screen readers both need the takeaway, not a description of bars and axes.
  - BAD: `"Bar chart showing data"` or `"Chart 1"`
  - GOOD: `"GEO-optimized pages earn 41% more AI citations than unoptimized pages (KDD 2024, N=10K queries)"`
- **Keep alt under 125 characters** when possible; use the data table as the extended description
- **Compression**: SVG → run through SVGO. WebP → quality 80. PNG → use as fallback only.
- **Lazy loading**: Add `loading="lazy"` to chart images below the fold. Never lazy-load the first visible chart.
- **Add to image sitemap** for faster discovery
- **Use `<figure>` + `<figcaption>`** to wrap every chart — `<figcaption>` text is crawlable and citable

### Step 8: Internal Linking

- Link the chart page FROM related blog posts and guides ("See our [benchmark data →]")
- Link FROM the chart page TO deeper analysis pages
- Use descriptive anchor text containing the key finding, not "click here"
- If the chart lives on a standalone data page, link it from the site's llms.txt

---

## Step 9: Visual QA — Render and Verify Before Delivery

**After generating any chart, you MUST open it in a browser and visually inspect it before delivering to the user.** SVG coordinate math is error-prone — elements frequently overflow, overlap, or clip.

### QA process
1. Save the chart as an HTML file
2. Open it in the browser (use `open` command)
3. Check for these common SVG issues:

| Issue | What to Look For |
|---|---|
| **Text overflow** | Labels or callout boxes extending past the SVG viewBox edge — especially right-side text, long annotations, and regional/legend callouts |
| **Text clipping** | Data labels cut off at top of chart (y too small) or bottom (below baseline) |
| **Overlap** | Bar labels overlapping each other, especially in horizontal bars with many rows |
| **Misalignment** | Data labels not centered over their bars/points |
| **Axis mismatch** | Data values that don't align with the axis scale visually |
| **Readability** | Text too small at rendered size, low contrast against background |

### Safe SVG layout rules
- **Right margin**: Keep all elements at least 20px inside the right edge of the viewBox
- **Top margin**: Data labels above bars need at least 20px from the top of the viewBox
- **Long text**: If a callout or annotation exceeds ~200px width, break it to multiple `<tspan>` lines or shorten it
- **ViewBox sizing**: Set the viewBox width to 680px and height to accommodate all content with 20px padding on all sides. Adjust height rather than cramming elements.

### If you find issues
Fix them immediately — adjust coordinates, shorten text, break lines, or expand the viewBox. Then re-open and verify the fix. Do NOT deliver a chart you haven't visually confirmed.

---

## Integration with Other Skills

This skill is designed to work alongside the **write-seo-geo-content** and **geo-content-research** skills.

### When called from write-seo-geo-content
The blog writer may request charts for Part 3 (problem statistics) or Part 4 (solution comparison). When creating charts for a blog post:
- Match the article's heading hierarchy — use `<h3>` for the chart's action title (not `<h2>`, which is reserved for article sections)
- Keep the chart inline within the article flow — don't create a separate page
- The key finding summary and "what this means" paragraph serve double duty as article body text — write them in the article's voice
- Still include the HTML data table and JSON-LD — these boost the article's overall GEO score

### When called from geo-content-research
The GEO skill may request charts for Phase 4 Data & Evidence Pages. When creating charts for these pages:
- Use `<h2>` for the chart's action title — these are standalone data pages
- Include the full CSV download and Dataset schema
- These pages are meant to be the primary citable source — make the data table comprehensive
- Link back to the comparison hub and category guide pages

---

## Complete Output Template

For every chart, deliver all of these:

```
1. TAKEAWAY HEADING
   <h2>AI Overviews Cite Top-10 Pages 78% of the Time</h2>

2. KEY FINDING SUMMARY (40-60 words, above chart)
   [Text block]

3. CHART
   [SVG code / Mermaid code / Chart config]

4. SOURCE & METHODOLOGY (below chart)
   Source: [Org], [Year]. N=[sample]. Methodology: [1 sentence].

5. "WHAT THIS MEANS" (2-3 sentences, after chart)
   [Interpretation paragraph]

6. DATA TABLE (HTML)
   [Full semantic <table>]

7. DOWNLOADABLE DATA
   [CSV content or link]

8. STRUCTURED DATA (JSON-LD)
   [Dataset schema]

9. IMAGE METADATA
   - Filename: [descriptive-name.svg]
   - Alt text: [conclusion-focused description]
   - Figcaption: [visible caption text]
```

---

## Quality Checklist

Before delivering any chart, verify:

- [ ] Takeaway heading states the key finding with a specific number
- [ ] Key finding summary is under 60 words and stands alone
- [ ] Chart uses max 3 colors (1 accent + grays), no borders, no background fill
- [ ] Action title states the insight as a complete sentence
- [ ] Direct data labels on bars/points — no legend needed
- [ ] Gridlines removed (or near-invisible #F1F5F9 when necessary)
- [ ] Source and methodology stated directly below the chart
- [ ] "What this means" paragraph provides actionable interpretation
- [ ] HTML data table with full semantic markup (`thead`, `th scope`, `caption`)
- [ ] Table values exactly match chart values
- [ ] CSV or downloadable data available
- [ ] Dataset JSON-LD schema with `variableMeasured` and `temporalCoverage`
- [ ] Descriptive filename (not chart1.png)
- [ ] Alt text describes the conclusion, not the visual form
- [ ] `<figure>` + `<figcaption>` wrapping
- [ ] SVG uses `<text>` elements (not baked text), `role="img"`, `aria-labelledby`
- [ ] Minimum 3:1 contrast for elements, 4.5:1 for text
- [ ] Color is not the only way meaning is conveyed
- [ ] No fabricated data — every number has a verifiable source
- [ ] Internal links planned: chart ↔ related content pages
- [ ] **VISUAL QA PASSED**: Chart opened in browser, verified no text overflow, clipping, overlap, or misalignment. All elements have 20px+ margin from viewBox edges.
