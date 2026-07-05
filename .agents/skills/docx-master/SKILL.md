---
name: docx-master
description: "Standardize, edit, or audit a Word (.docx) document via direct OOXML mutation. Two CLIs: `apply` (the unified writer — install styles + numbering + theme + template, restyle by pattern / fingerprint, insert content via edits, all in one config), `audit` (read-only conformance check, no file written). Common config shapes inside `apply`: standardize (role-based whole-doc reshape — paragraph classification, named styles, multi-level auto-numbering, template import), edit (location-based surgical changes — replace/insert/delete paragraphs, table cells, image embedding, optional tracked changes). Use whenever the user wants to format / restyle / normalize / edit / audit a Word document. Do NOT use for: PDFs, spreadsheets, or plain-text / Markdown source files (unless the task is specifically to *output* a docx)."
---

# docx-master

Mutates Word (.docx) OOXML directly: produce well-formed documents from messy templates, install styles + numbering, convert hand-typed prefixes to auto-numbering, insert content, audit conformance. Output is a new docx; the original is never touched.

## How to think about formatting

User prompt overrides everything below.

Otherwise, treat a document as two kinds of paragraphs:

- **Content chrome** — paragraphs with typed text already in the document (chapter markers, instruction notes, fixed labels). Three operations:
  - **Preserve typography** (font / size / spacing / indent — direct `pPr` / `rPr`). Engine's selective-strip keeps direct format as long as the new style doesn't override the same attribute.
  - **Retag structure** (bind `pStyle`, strip typed structural prefixes via `pattern_rules`, install matching `numbering`). Chapter / heading / list / caption markers are structure, not typography — they belong to auto-numbering or SEQ fields. Existing typed prefixes are the **input** to retagging, not output to preserve.
  - **Don't replace, don't duplicate.** A chrome paragraph stays as itself — never the target of `replace`, never quoted into an inserted paragraph's `text`. Content insertion lands in the empty placeholder slot beside the chrome (`set-run` on inline blanks; `replace` against the empty slot for separate-paragraph forms).
- **Empty slots** — blank paragraphs pre-allocated for content insertion. Bind inserted content to a semantic style (`BodyText` / `ListNumber` / `Heading1..N`), installing the style in `styles[]` if no existing one fits. `Normal` is fallback, not a body style.

**For `styles[]`**: one style per semantic role. If the role has any paragraph already playing it in the source, the entry MUST use `fromParagraph: N` — do not redeclare top-level typography fields on represented roles (silent template override). Full rule and rationale: [standardize.md §1](references/standardize.md).

Tools surface visible facts; classification and judgment are yours.

**Standardize-shape blocks install the canonical anchors every other op binds to** — `edits[]` `styleId` + MDF, `pattern_rules` fingerprints, `InlineRef` / STYLEREF resolution. Every paragraph the agent writes is canonical: typed structural signals (heading / list / caption prefixes, in-prose counters) never appear as literal text in the emit; install the matching anchor (`numbering` / `captions` / bookmark) and let it render the signal. Source chrome the task doesn't restructure stays as-is. User-supplied content that arrives with typed prefixes is input shape, not a directive to preserve them — strip the prefix and emit each typed-prefix line as a **separate** paragraph bound to a heading / list / caption style, unless the user explicitly requested literal typed form.

## Target state

A well-formed Word document expresses structure through **styles + numbering + sections + SEQ fields**, not typed text mimicking structure. When designing the reshape:

- Every paragraph carries a semantic styleId (Heading1..N / BodyText / ListNumber / Caption / etc.); direct paragraph format only as one-off exceptions.
- Numbering: one unified multi-level scheme bound to heading styles; separate single-level schemes per list-bound style. Auto-numbering markers come from the scheme, never typed in `text`.
- Captions (figures / tables / equations) use top-level `captions` config + `CaptionBlock` / `EquationBlock` — SEQ + STYLEREF fields, not `pattern_rules`. **Placement: figure / equation captions go below; table captions go above.** See [`references/captions.md`](references/captions.md).
- Cross-references (any cite to an auto-numbered target — figures, tables, sections, equations, reference entries) use `InlineRef` nodes in `edits[]`, never typed counters. Literal counters silently desync when a target moves; REF fields stay correct. Page-number cites out of scope. See [`references/cross-references.md`](references/cross-references.md).
- Heading levels nest without skipping.
- Match content shape to slot shape — prose to body, list to `ListNumber` / `ListBullet`, figure / table / equation to their `*Block` types with `captionId`. Per-block schemas in [`references/edit.md`](references/edit.md).
- Locale: CJK prose body and list items get a 2-char first-line indent (`firstLineIndent: "2char"`). No typed spaces at CJK ↔ Latin / digit boundaries; Word's autoSpace handles them. Chinese font sizes: [`references/chinese-font-sizes.md`](references/chinese-font-sizes.md).

## Commands

| Command | When | Reference |
|---|---|---|
| **`apply`** | The unified writer. Install styles + numbering + theme + template, restyle by pattern / fingerprint, insert content via edits — single config, single call. | [standardize.md](references/standardize.md) + [edit.md](references/edit.md) |
| `audit` | Read-only conformance check workflow. No CLI; uses the inspect tools to produce a violation report. | [audit.md](references/audit.md) |

`apply` pipeline order:

```
install styles + numbering + theme + template
  → run edits (referencing just-installed styleIds)
  → re-fingerprint
  → run rules (pattern_rules / bulk_rules / assignments / exclude —
    match BOTH pre-existing chrome AND agent-inserted content uniformly)
  → validate, write
```

Sparse by design — only declared blocks apply; untouched styles / numbering / paragraphs / theme stay as they are. **Declare only what's wrong, missing, or what the user explicitly asks to change.**

**Creating from scratch.** Omit `source` to scaffold from the bundled blank template (one empty Normal paragraph, A4 portrait, no other styles or numbering). Declare what you need in the usual blocks (`styles` / `numbering` / `pageSetup` / `headerFooter` / `edits`); `styles[]` must use Mode B (direct fields) since the blank has no representative paragraphs to extract from. The empty paragraph at index 1 is a `replace` or `insert-after` target (`insert-before` creates a stray leading empty paragraph; `delete` would empty the body). Incompatible with `template` (transplanting from a template into a blank is conceptually inconsistent — start with a host source if you need template-import).

## Workflow

1. **Survey.** `overview` first. From the output, note:
   - **Existing structure** — Heading levels, numbering schemes (with consumption counts; 0 = orphan), fingerprints, document skeleton.
   - **Content chrome formatting** — what direct `pPr` / `rPr` content paragraphs carry. This IS the document's typographic convention; preserve it by not redeclaring those attributes on the re-tagging styles.
   - **Typed structural prefixes** — heading shapes (`第N章`, `一、`, `1.1`, `（一）`) feed `pattern_rules`; caption shapes (`图 2.1`) and in-prose counters (`如图 3.2`) feed caption / cross-ref migration via `edits[]` (different mechanism).
   - **Form-fill paragraphs** — text shaped like `label + whitespace gap` or `label + ____ underscore placeholder`. The blank is usually a separate run with `<w:u/>`. Note indices for Step 2.
   - **Source content** (fill tasks) — the structural outline of what will land: which semantic roles appear (Heading 1..N, BodyText, ListNumber/Bullet, Caption, inline cross-refs), heading depth, list / figure / table / equation presence.
2. **Design ONE config.** Plan styles first based on the content's structural outline; route in one config. Six config blocks (`styles` / `numbering` / `pattern_rules` / `bulk_rules` / `assignments` / `exclude` / `edits`) detailed in [standardize.md §1–§3](references/standardize.md) and [edit.md](references/edit.md). Reactive additions accrete debt.
3. **Dry-run.** `apply --dry-run` first. The change report's signals (Style Resolution / Sample Affected / Implicit-keep failure / unmatched stripPrefix) — see [standardize.md §5](references/standardize.md).
4. **Apply.** Output is a fresh docx; the original is never modified.

## Asking the user

Default first. Don't ask unless one of the cases below applies:
- typed sentinel mid-prose vs. heading
- bold paragraph as sub-heading vs. emphasis
- missing source content for template slots
- unsupported structures (footnotes, page-number cites)
- font / spacing prompt without explicit scope (theme layer vs `Normal` cascade vs per-role `styles[]` — see [standardize.md "Font scope layers"](references/standardize.md))

## Out of scope

Surface to the user when blocked by: layout-**table** restructuring, TOC body content, footnotes / comments, page-number cites. Paragraphs *inside* layout-table cells ARE indexed and fully editable; only the table holding them is off-limits.

Page setup (paper size, orientation, margins, columns, page-number format) and headers / footers ARE supported, including per-section overrides — see [`config-schema.md`](references/config-schema.md#page-setup) and [`references/header-footer.md`](references/header-footer.md).

## Tool Reference

All tools invoked via `node <script> <args>`, output to stdout.

| Tool | Invocation | When to Use |
|------|------------|-------------|
| `overview` | `node scripts/overview.js <file> [--paras=A..B\|none] [--include-unused]` | First call on any task. Metadata, page setup, theme, style defs, numbering schemes (with `used by N paragraphs` count — 0 flags orphans), visual style statistics with **direct-format per fingerprint** (drives "don't redeclare" rule), document skeleton. `--paras` slices or drops the skeleton; `--include-unused` shows usage=0 styles. |
| `inspect_range` | `node scripts/inspect_range.js <file> <from> <to>` | Full text and computed styles for a paragraph range. |
| `inspect_runs` | `node scripts/inspect_runs.js <file> <para>` | Per-run rPr dump. Use for paragraphs with mixed run-level formatting OR **form-fill segments** (label + underscore-blank pattern). |
| `inspect_neighbors` | `node scripts/inspect_neighbors.js <file> <para> [--radius N]` | What surrounds a paragraph. First choice for figure-caption / table-caption / first-after-heading classification. |
| `inspect_style` | `node scripts/inspect_style.js <file> <fingerprint>` | What role a fingerprint plays. `<fingerprint>` accepts letter label or 6-char hash. |
| `inspect_style_def` | `node scripts/inspect_style_def.js <file> <styleId>` | Pre-defined styles in `styles.xml` and their `basedOn` chain. Use before reusing or overriding an existing styleId. |
| `inspect_section` | `node scripts/inspect_section.js <file> <index>` | Page setup differences between sections. |
| `inspect_table` | `node scripts/inspect_table.js <file>` | Top-level tables with `[row,col]` cell snippets and per-cell paragraph-index spans. Use before composing a `cell` locator or a `range` touching table content. |
| `inspect_blockers` | `node scripts/inspect_blockers.js <file>` | Paragraphs `apply`'s edit phase will refuse — tracked changes, complex fields, SDT controls. |
| `inspect_caption` | `node scripts/inspect_caption.js <file> [identifier]` | SEQ-based captions in the document. See [captions.md](references/captions.md). |
| `migrate_captions` | `node scripts/migrate_captions.js <file> [--style <styleId>]...` | Read-only detector for manually-numbered caption-shaped paragraphs (`图 2.1` typed, no SEQ). Agent uses the output to write apply config converting them to `CaptionBlock`. |
| `find_paragraphs` | `node scripts/find_paragraphs.js <file> --regex <pat> [--flags <flags>] [--limit N] [--fingerprint X]` | Cross-document paragraph regex. Validate `pattern_rules` coverage before applying. |
| `find_text` | `node scripts/find_text.js <file> <pattern> [--regex] [--paragraph N \| --range A-B] [--limit N] [--context N]` | Character-level locator. Returns paragraph index, run index, char offset, length, structural-region annotations. Pair with `inspect_runs` for rPr or with `set-run` to replace at `runIndex`. |
| `validate` | `node scripts/validate.js <file>` | Schema-aware OOXML check. `apply` runs this automatically; standalone for spot-checking arbitrary .docx files. |
| `apply --dry-run` | `node scripts/apply.js --dry-run <config.json>` | Iterate on a config without writing. **Use between every config edit.** |
| `apply` | `node scripts/apply.js <config.json>` | Unified writer. Default for any write task. |

## Cross-command invariants

- Original file is never modified; every applying CLI writes a fresh copy + validates before keeping. Validation uses baseline-diff — only errors *introduced* by the run are fatal. See [`standardize.md §Validation behavior`](references/standardize.md#validation-behavior); `--allow-validation-warnings` override is documented in [`config-schema.md`](references/config-schema.md).
- Section properties sparse-by-design: untouched unless declared via `pageSetup`. Details: [`config-schema.md`](references/config-schema.md#page-setup).
- Paragraph indexing is 1-based, matching `#NNN` in skeleton. Layout-table paragraphs are indexed; data-table cell paragraphs aren't. Both are reachable by surgical edits — layout cells via global `#NNN` index, data cells via `cell` locator with optional `paragraph: K` / `to: M`. `RunLocator` accepts cell coords too for `set-run`. See [`references/edit.md` locator table](references/edit.md#locators-at).
- All `edits[]` locators resolve against the **pre-edits** document state — `#NNN` from `overview` is what locators reference, regardless of intervening ops. Resolved Element refs survive subsequent mutations.
- Paths resolve against CWD; use absolute paths if you may have changed directories.
- Restyle: run-level direct formatting uniform across all runs gets stripped; per-run differences preserved as intentional inline emphasis.
- Field codes (`STYLEREF` / `TOC` / `REF` / `DATE` / …) preserved as-is; not editable inside. TOC content is not regenerated — user must right-click → "Update Field" in Word.
- Edit blockers: the edit phase refuses paragraphs inside existing tracked changes / complex fields / SDT controls. Run `inspect_blockers` first.
- Style-name preflight: before any mutation, the engine catches `<w:name>` collisions (including en/zh-CN locale aliases) and aborts with a fix hint; `--dry-run` lists collisions as warnings instead.

Block-level config details: [`references/standardize.md`](references/standardize.md), [`references/edit.md`](references/edit.md), [`references/config-schema.md`](references/config-schema.md).

## Where things live

- **Field semantics** (any apply config field — values, constraints, defaults) → [`references/config-schema.md`](references/config-schema.md)
- **Locator + op contracts** (addressing, edit ops, block types) → [`references/edit.md`](references/edit.md)
- **Workflow** (audit → standardize → edit pipeline, design decisions) → respective workflow refs (`audit.md`, `standardize.md`, `edit.md`)
- **Domain knowledge** (Chinese counting patterns, caption pipeline, classifier reasons, table layouts) → concept refs (`numbering-formats.md`, `captions.md`, `tables.md`, `equations.md`, `cross-references.md`, `header-footer.md`, `chinese-font-sizes.md`)
