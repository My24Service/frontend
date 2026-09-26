# Handoff: quotation slice — state at interruption

Branch: `feature/refactor-quotation-slice` (off `develop-evert` at `fa73c3da`).
Written when the four parallel screen subagents were cancelled mid-flight; the
shared seams are landed, no screen is migrated yet.

## What is done and committed

1. `270c7fbe` — **fix(tests): scan `src/composables` in the test auto-imports too.**
   A pre-existing breakage, not ours: `c8f85744` (the last commit on
   `develop-evert`) added `dirs: ['src/composables/**/*']` to the *app* build's
   `AutoImport` in `vite.config.js` but not to `vitest.config.js`. Every spec
   mounting an SFC that calls `useCommon()` failed with `ReferenceError:
   useCommon is not defined` — 30+ invoice tests included. Fixed by adding the
   same `dirs` entry to `vitest.config.js`. **Do not revert this**; without it
   the suite is red for reasons unrelated to the migration.

2. `9396e19f` — **refactor(costing): extract the shared cost-collection
   machinery from the invoice form.** The handoff's step 3.

3. `docs/quotation-slice-characterisation.md` — the characterisation plus the
   plan and the shared/quotation-only decision. Read it first; it is the
   reasoning behind everything below.

## What is done but NOT committed

Uncommitted on top of `9396e19f`:

- `src/features/costing/use-cost-collection.ts` — `CostRow` gained
  `chapter?`, `vat_currency?`, `total_currency?`, needed because a quotation
  cost row carries a chapter and sends its currency companions. `vue-tsc` is
  clean with this and the invoice specs pass.
- `src/features/quotation/form/quotation-cost-source.ts` — the quotation's
  `CostCollectionSource` (list query `quotation+chapter+cost_type`, the
  `quotationCreate` replace-set, and `vQuotationCostRowRequest` row bodies that
  **do** carry `vat`/`total`, unlike the order twin). Note `import * as v from
  'valibot'` at the top — `v` is not auto-imported.
- `src/features/quotation/form/calculations.ts` — quotation-line maths, three
  thin wrappers over the shared costing helpers.

Verify before starting (both were green at interruption):
`npx vue-tsc --noEmit` and
`npx vitest run tests/unit/features/invoice-cost-panels.spec.js tests/unit/features/invoice-calculations.spec.js`.

**Commit these three before doing anything else**, so the next agent has a clean
base. They are scaffolding with no consumers yet, which is fine mid-branch.

## The shared seam (the important architectural decision)

`src/features/costing/` is the shared feature. It is the invoice's own cost
machinery, moved out and renamed onto the concept, with invoice as the only
consumer so far. The four invoice *panels* stayed in `features/invoice/form/`
because their drafts are seeded from order activity totals and Teamleader
products — invoice-specific. The quotation panels will be their own.

The seam is `CostCollectionSource` (in `use-cost-collection.ts`):

| member | who knows it |
|---|---|
| `listOptions()` | the consumer (returns `null` to keep the query disabled) |
| `replace(path, body)` | the consumer (a plain async fn, not the generated mutation options — see the comment on why) |
| `replacePath()` | the consumer |
| `rowBody(row)` | the consumer (parses through its own endpoint's request schema) |

Plus `CostPanelContext` (`cost-panel-context.ts`), renamed from the invoice's
vocabulary to the concept: `parentPk` (was `orderPk`), `lines` (was
`invoiceLines`), `linesCreated` (was `invoiceLinesCreated`).

**Gotcha:** `@/features/invoice` still re-exports the moved names so the invoice
surface and its 10 spec files are unchanged. Only
`tests/unit/features/invoice-cost-panels.spec.js` needed edits, and only for
the renamed context keys plus `useOrderCostSource` in the one test that calls
`useCostCollection` directly. Every wire-shape/body/copy assertion is
untouched. `src/features/invoice/form/panels/index.ts` re-exports the moved
components from `@/features/costing`.

## What is NOT done

Every screen. `src/views/quotations/`, `src/models/quotations/` and
`src/router/quotations.js` are untouched and still mounted. The four subagent
briefs I had queued (list; detail; pdf+customer+offer; form panels) are
reproduced in `docs/agents/quotation-slice-briefs.md` — use them, but **run one
at a time or two at most**, and check on each one after ~2 minutes. Four
concurrent agents all stalled with no output; two or three is what worked for
the earlier research agent.

## Order of work (unchanged from the handoff's, with what each step now needs)

1. Commit the WIP above.
2. `list/` — `QuotationList` on the table kit, modes by `route.name`.
3. `detail/` — `QuotationView`, markup-parity snapshot like invoice-detail.
4. `pdf/`, `customer/`, `offer/` — the three small screens.
5. `form/` — the shell (`QuotationForm.vue`, `QuotationData`, `CustomerForm`,
   `ChapterPanel` owner) plus the four panels and the line panel.
6. `form/schemas.ts` for the quotation create/update bodies, per
   `docs/agents/form-schemas.md` (parse the generated request component, labels
   in `FIELD_LABELS`, no redeclared entries).
7. `index.ts` barrels per subfolder + `src/features/quotation/index.ts` +
   `README.md` modelled on `src/features/customer/README.md` (its ledger table
   is the thing to copy).
8. `src/router/quotations.js` → point at the feature barrels, lazy loaders kept.
9. Delete `src/views/quotations/`, `src/models/quotations/`, the mixin; move
   the 5 legacy specs under `tests/unit/features/` (their import paths change).
10. Full verification (below) + a summary in the guide's COMPLETION shape.

## Verification commands (all slow — budget for it, use generous timeouts)

```
npx vitest run                       # ~90s+, never run with a 30s timeout
npx vue-tsc --noEmit                 # ~2min
NODE_OPTIONS=--max-old-space-size=8192 npx eslint <files>   # per-file; the
                                                      whole-repo `npx eslint src`
                                                      OOMs on this machine
npm run lint                         # scripts/lint.mjs, one file at a time,
                                      # but it exceeds 10min wall clock
npm run lint:i18n
npm run test:mutation -- --mutate 'src/features/quotation/**/*.ts'
```

## Traps found the hard way

- `npx vitest run` times out at the default 30s. Always pass a large `timeout`.
- The edit tool truncates a **new** file if the content is over ~6k characters,
  and it will happily create a `vitest.config.ts` when you meant `vitest.config.js`
  (it then shadows the real config and vitest fails with `Unexpected end of file`).
  Write big files in several `edit` calls, appending.
- `v` (valibot) is NOT auto-imported; `schemas` IS (from `valibot.gen`).
  Import `* as v from 'valibot'` explicitly.
- `src/api/resources.gen.ts` is generated — the quotation resources already
  exist: `QuotationQuotation` (+ `Preliminary`/`Sent`/`NotAccepted`),
  `QuotationCost` (with `extras.quotationCreate`), `QuotationChapter`,
  `QuotationQuotationLine` (+ `QuotationQuotationLineChapter.create`),
  `QuotationOffer`, `QuotationDocument`, `QuotationStatus`.
- `mainStore` getters are `getQuotationDefaultVat`, `getQuotationDefaultHourlyRate`,
  `getQuotationDefaultPricePerKm`, `getQuotationDefaultCallOutCosts`,
  `getQuotationDefaultExpireDays`, `getDefaultCurrency` (see
  `src/stores/main/index.ts`).
- Row-body contracts differ and both are pinned by the existing specs: the
  order row sends **inputs only** (no `total`/`vat`); the quotation row sends
  `vat` and `total` too, because the backend does not price it. Do not "fix"
  that asymmetry without a backend change.
- The quotation replace-set is **chapter-scoped** (`?chapter=<id>`) on purpose:
  "absent from the list" means delete, so an unscoped save deletes other
  chapters' rows of the same type.
