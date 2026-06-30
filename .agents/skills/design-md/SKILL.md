---
name: design-md
description: Google's DESIGN.md format spec for describing visual identity to coding agents. Use this skill when creating, reading, validating, or editing DESIGN.md files that define design systems with machine-readable tokens and human-readable rationale.
---

# DESIGN.md Skill

You are an expert at working with the DESIGN.md format — a self-contained, plain-text representation of a design system created by Google Labs Code. DESIGN.md gives AI agents a persistent, structured understanding of a visual identity through design tokens and prose.

## What is DESIGN.md?

DESIGN.md combines:
- **YAML front matter** — Machine-readable design tokens (colors, typography, spacing, rounded, components)
- **Markdown body** — Human-readable design rationale organized into `##` sections

The tokens are the normative values. The prose provides context for how to apply them.

## File Structure

```
---
version: alpha
name: Your Design System
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 48px
    fontWeight: 600
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 8px
  md: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
```

## Token Schema

```yaml
version: <string>        # optional, current: "alpha"
name: <string>           # required
description: <string>    # optional

colors:
  <token-name>: <Color>  # any CSS color: hex, rgb(), oklch(), named, etc.

typography:
  <token-name>:
    fontFamily: <string>
    fontSize: <Dimension>       # e.g., 48px, 1.5rem
    fontWeight: <number>        # e.g., 400, 700
    lineHeight: <Dimension|number>  # e.g., 24px or 1.6
    letterSpacing: <Dimension>  # e.g., -0.02em
    fontFeature: <string>       # optional, CSS font-feature-settings
    fontVariation: <string>     # optional, CSS font-variation-settings

rounded:
  <scale-level>: <Dimension>    # e.g., sm: 4px, md: 8px, full: 9999px

spacing:
  <scale-level>: <Dimension|number>  # e.g., sm: 8px, gutter: 24px

components:
  <component-name>:
    backgroundColor: <Color|token-ref>
    textColor: <Color|token-ref>
    typography: <Typography|token-ref>
    rounded: <Dimension|token-ref>
    padding: <Dimension>
    size: <Dimension>
    height: <Dimension>
    width: <Dimension>
```

## Token Types

| Type | Format | Example |
|------|--------|---------|
| Color | Any CSS color | `"#1A1C1E"`, `"oklch(62% 0.18 250)"` |
| Dimension | number + unit | `48px`, `-0.02em`, `1.5rem` |
| Token Reference | `{path.to.token}` | `{colors.primary}` |
| Typography | object | See schema above |

## Section Order (Canonical)

Sections use `##` headings. Omit if not relevant, but present ones MUST appear in this order:

1. **Overview** (aliases: "Brand & Style")
2. **Colors**
3. **Typography**
4. **Layout** (aliases: "Layout & Spacing")
5. **Elevation & Depth** (aliases: "Elevation")
6. **Shapes**
7. **Components**
8. **Do's and Don'ts**

## Section Details

### Overview / Brand & Style
Holistic description of look and feel. Defines brand personality, target audience, emotional response. Foundational context for high-level stylistic decisions.

### Colors
Define color palettes. At least `primary` must be defined. Common naming: `primary`, `secondary`, `tertiary`, `neutral`.

### Typography
Define typography levels (typically 9-15 levels). Common names: `headline-display`, `headline-lg`, `body-md`, `label-caps`, etc.

### Layout
Describe layout and spacing strategy (grid-based, fluid, etc.). The `spacing` tokens support the layout model.

### Elevation & Depth
How visual hierarchy is conveyed — through shadows, tonal layers, borders, or color contrast.

### Shapes
How visual elements are shaped — corner radius language, shape patterns.

### Components
Style guidance for component atoms. Common types: buttons, chips, lists, tooltips, checkboxes, radio buttons, input fields.

**Variants** are expressed as separate entries: `"button-primary"`, `"button-primary-hover"`, `"button-primary-active"`.

### Do's and Don'ts
Practical guidelines and guardrails for applying the design system.

## Token References

References use `{path.to.token}` syntax pointing to YAML tree values:
- Within components, references to composite values allowed: `{typography.label-md}`
- Within other groups, must point to primitive values: `{colors.primary}`

## CLI Tools

```bash
# Lint a DESIGN.md file
npx @google/design.md lint DESIGN.md

# Compare two versions
npx @google/design.md diff DESIGN.md DESIGN-v2.md

# Export to Tailwind v3 (JSON config for tailwind.config.js)
npx @google/design.md export --format json-tailwind DESIGN.md

# Export to Tailwind v4 (CSS @theme block with custom properties)
npx @google/design.md export --format css-tailwind DESIGN.md

# Export to W3C Design Tokens Format (tokens.json)
npx @google/design.md export --format dtcg DESIGN.md

# View full spec
npx @google/design.md spec
```

## Programmatic API

The linter is also available as a library for integration into build scripts:

```javascript
import { lint } from '@google/design.md/linter';
const report = lint(markdownString);
console.log(report.findings);    // Finding[]
console.log(report.summary);     // { errors, warnings, info }
console.log(report.designSystem); // Parsed DesignSystemState
```

**Windows/PowerShell tip:** Use `designmd` alias instead of `design.md` to avoid file association conflicts:
```bash
npx -p @google/design.md designmd lint DESIGN.md
```

## Linting Rules

| Rule | Severity | What it checks |
|------|----------|----------------|
| broken-ref | error | Token references that don't resolve |
| missing-primary | warning | Colors defined but no primary |
| contrast-ratio | warning | Component pairs below WCAG AA (4.5:1) |
| orphaned-tokens | warning | Colors never referenced by components |
| missing-typography | warning | Colors defined but no typography |
| section-order | warning | Sections out of canonical order |
| unknown-key | warning | Top-level YAML key looks like a typo |

## Consumer Behavior for Unknown Content

| Scenario | Behavior |
|----------|----------|
| Unknown section heading | Preserve; do not error |
| Unknown color token name | Accept if value is valid |
| Unknown typography token name | Accept as valid |
| Unknown component property | Accept with warning |
| Duplicate section heading | Error; reject the file |

## Recommended Token Names (Non-Normative)

**Colors:** `primary`, `secondary`, `tertiary`, `neutral`, `surface`, `on-surface`, `error`

**Typography:** `headline-display`, `headline-lg`, `headline-md`, `body-lg`, `body-md`, `body-sm`, `label-lg`, `label-md`, `label-sm`

**Rounded:** `none`, `sm`, `md`, `lg`, `xl`, `full`

## When to Use This Skill

- Creating a new DESIGN.md file for a project
- Validating an existing DESIGN.md against the spec
- Exporting design tokens to Tailwind, CSS, or W3C DTCG format
- Describing a design system to other agents or tools
- Reviewing design token consistency and contrast ratios
- Converting between DESIGN.md and other design token formats

## How to Create a DESIGN.md

1. Start with `---` front matter containing tokens
2. Add `name` and optionally `version`, `description`
3. Define `colors` with at least `primary`
4. Define `typography` with headline, body, and label levels
5. Add `rounded` and `spacing` scales
6. Define `components` referencing tokens with `{path}` syntax
7. Write markdown sections in canonical order with prose rationale
8. Validate with `npx @google/design.md lint`
