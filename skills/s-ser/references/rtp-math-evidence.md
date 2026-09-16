# RTP repository and mathematical evidence

Read this reference for scheme fields, random generation, probability, symbol size/count,
dynamic weights, payout or RTP questions. A JSON structure result does not establish the
meaning of a field or prove that runtime code consumes it.

## Repository map

The canonical root is `<server-root>/slot-rtp-scheme`. Inventory the actual checkout before
use; the following names are discovery guides, not a fixed list of games:

```text
slot-rtp-scheme/
  试玩版json/                 {GAME_CODE}_{Chinese game name}_试玩版.json
  正式版json/                 {GAME_CODE}_{Chinese game name}_正式版.json
  文档说明/
    {numeric prefix}_{Chinese game name}说明.docx
    00_WAYS基础规则.docx
    00_LINE基础规则.docx
    00_CONTINUE基础规则.docx
    00_COLLECT基础规则.docx
    RTP控制算法逻辑.docx
    数值参考文档.xlsx          May contain the game index and tuning guidance
  README.md
```

JSON supplies field structure and values. A game document explains its special generation,
counting, replacement and probability rules. The applicable `00_*` document supplies shared
rules; the RTP document describes controller behavior and may contain examples for other
games. The workbook can locate game names, rule families and tuning notes. Do not transfer
an example game's board, special symbols or probability unit into the target game.

## Discover the complete evidence set

1. Derive `GAME_CODE` from the runner's registration. Derive the Chinese name and aliases from
   matching JSON names, runner metadata and, when needed, the workbook's game index. Office
   filenames may use a numeric prefix and Chinese name without the game code.
2. Use `rg --files` to inventory both JSON directories and `文档说明/`. Search filenames by
   both game code and Chinese name. Read the matched game document and the applicable basic
   rule document before interpreting fields. Search the workbook by game code/name when
   filenames are insufficient; retain the surrounding row headers and sheet name.
3. Honor the reference edition already selected by the user or accepted task contract.
   Default to Trial only when no edition has been selected. When Formal was already
   authorized, select its exact JSON and pass `-ReferenceEdition Formal` to the validator;
   absence of a trial file is not a reason to ask again or stop the authorized work.
4. Apply the existing controlled-sync policy once per needed baseline. Record repository
   commit, selected edition, source path and SHA-256. Preserve the user's existing reference
   choice across turns. Do not move or reorganize files in `slot-rtp-scheme`.
5. For each relevant document, record the path/hash and paragraph/table or worksheet/cell
   locations actually read. Search results alone are not document review. Before reporting
   an undefined field, missing probability denominator or absent mathematical description,
   inspect the game document, relevant basic rules and available workbook entries. If the
   sources conflict, identify the conflicting passages instead of silently choosing one.

Keep source documents and extracted content local. Store any needed extracts in the normal
task evidence directory or a task-owned temporary directory, never inside the reference
repository. Do not upload mathematical documents to external conversion services.

## Read Office files locally

DOCX and XLSX are ZIP containers. `rg` over their compressed bytes is not a text search.
Use an available local Office library or Python's `zipfile` and `xml.etree.ElementTree`;
do not require a remote converter or Microsoft Office installation.

For DOCX, read `word/document.xml` and traverse `w:body` children in document order. Keep
paragraph boundaries, headings, table rows and cells. For tables preserve cell paragraphs,
column positions and merged-cell metadata (`w:gridSpan` / `w:vMerge`) when interpreting
which condition or probability belongs to which value. Record paragraph/block and table
row indexes in the extract. Inspect relevant headers, footnotes or embedded images if a
cross-reference or formula points there; XML text extraction does not read a formula image.

For XLSX, first list workbook sheets, then read the matching game rows and tuning sections.
Use `openpyxl.load_workbook(path, read_only=True, data_only=False)` when installed and a
second `data_only=True` view when cached calculated values are needed. Preserve sheet name,
cell coordinates, neighboring row/column headings, formula text, number formats and merge
context. Do not present missing or stale cached values as newly calculated results.

Without `openpyxl`, resolve `xl/workbook.xml` sheet relationship IDs through
`xl/_rels/workbook.xml.rels`; parse the target worksheet XML, `sharedStrings.xml` when
present, inline strings, cell types, `<f>` formulas and `<v>` cached values. Use `styles.xml`
when percent/date formatting changes the interpretation. Sheet order does not prove a
particular `sheetN.xml` filename. Preserve empty column positions using cell references.

On Windows, prefer a UTF-8 temporary Python file invoked with `python -X utf8` and pass
Office paths as arguments. Non-ASCII literals piped through Windows PowerShell's default
encoding can turn Chinese filenames into question marks even with `python -X utf8`.

## Map semantics to actual generation

For every in-scope probability or weight field, capture this chain:

`source passage/table -> JSON path/value -> parsed setting -> active call site -> RNG event -> result assertion`

The mapping must identify:

- Probability versus relative weight, denominator/normalization, comparison boundaries,
  and the residual outcome such as zero symbols or no feature.
- Whether a row ID means symbol count, block length, multiplier, mode or another choice;
  distinguish visual cell span from the number of blocks.
- Scope: game mode, physical reel index, initial fill/refill/replacement, available cells,
  maximum count and whether unavailable outcomes are discarded, capped or renormalized.
- Random order, placement, symbol selection, retained state and any special-symbol
  restrictions. Trace `dynamicWeight` at the appropriate generation/replacement phase.

Follow the running configuration source through boot, overrides and `SetChances`/equivalent;
an embedded JSON matching the reference does not prove it is the active runtime scheme.
Classify fields as consumed, parsed only, ignored by documented design, or unresolved.
Use a sibling game's code only to compare implementation patterns and explicit differences.
Do not infer a denominator or count-to-length mapping solely from similar field names.

Verify configuration consumption with focused boundary cases: disabling an outcome,
forcing a supported outcome, and an exact cumulative sampling boundary or deterministic
RNG case. Test the resulting count/span/placement rather than only JSON parsing. Where
changes affect conditional probability, state the sampling population; a per-column draw
is not an entire-spin occurrence rate.

Keep three results separate: JSON structure/source availability, implemented mathematical
semantics and configuration consumption, and measured RTP/sign-off. `VALID` from the
structure validator, an existing test pass or a small sample cannot stand in for the other
results. Only the rules affected by missing or conflicting evidence remain unresolved.
