# The Quotation Slice — characterisation and plan

What the legacy quotation screens do today, pinned before anything moves, and
the decision about what becomes shared. Read this with
`docs/agents/feature-refactoring-guide.md` (the procedure),
`docs/order-slice-characterisation.md` (the same exercise for orders) and
`src/features/customer/README.md` (the reference slice).

Handoff: `docs/handoffs/03-quotation-feature.md`. Work happens on
`feature/refactor-quotation-slice`.

## Scope

In: everything `router/quotations.js` mounts, plus the quotation-domain code
only those screens use.

```
src/router/quotations.js              the routes (below)

src/views/quotations/
  QuotationList.vue                   all three list modes + preliminary + sent
  QuotationView.vue                   the read-only PDF-style view
  QuotationDetail.vue                 a thin wrapper: QuotationForm is-view
  QuotationForm.vue                   create/edit + chapters + cost panels
  OfferForm.vue                       the send-quotation e-mail
  CustomerView.vue                    the customer block on the view
  QuotationPDFViewer.vue              preview / definitive PDF modal

src/views/quotations/quotation_form/
  QuotationLine.vue                   the chapter line editor (548)
  MaterialsCreate.vue                 the materials cost panel (483)
  Hours.vue, Distance.vue, CallOutCosts.vue   the other cost panels
  CostsTable.vue, TotalRow.vue, VAT.vue, Header.vue, SectionHeader.vue
  AddToQuotationLines.vue, EmptyQuotationLinesContainer.vue
  CustomerForm.vue, QuotationData.vue, Chapter.vue, DocumentsComponent.vue
  mixin.js, constants.ts

src/models/quotations/
  Quotation.js, QuotationLine.js, Cost.js, Chapter.js, Offer.js,
  Document.js, Status.js, QuotationStatuscode.js (a Shim)
```

Out, deliberately: `@/components/TableStatusInfo.vue`,
`@/components/StatusesComponent.vue` (shared with order and invoice),
`@/components/OrdersTable.vue`, the `documents` feature's
`DocumentCollectionEditor` (already migrated), `src/models/customer/Customer.js`
(the Customer Slice's Shim), `src/models/inventory/Material.js`.

## Routes

| name | path | component | props |
|---|---|---|---|
| `quotation-list` | `/quotations/quotations` | QuotationList | — |
| `preliminary-quotations` | `/quotations/preliminary` | QuotationList | `...params` |
| `quotations-sent` | `/quotations/sent` | QuotationList | `...params` |
| `quotation-view` | `/quotations/quotations/view/:pk` | QuotationView | `pk` |
| `quotations-sent-view` | `/quotations/sent/view/:pk` | QuotationView | `pk` |
| `quotation-add` | `/quotations/preliminary/form` | QuotationForm | — |
| `quotation-edit` | `/quotations/quotations/form/:pk(\d+)` | QuotationForm | `pk` |
| `quotation-edit-preliminary` | `/quotations/preliminary/form/:pk(\d+)` | QuotationForm | `pk` |
| `quotation-send` | `/quotations/sent/form/` | OfferForm | — |
| `quotation-detail` | `/quotations/quotations/detail/:pk` | QuotationDetail | `pk` |

All carry `meta.authLevelNeeded: [AUTH_LEVELS.PLANNING]` and mount `SubNav`
with `section: 'quotations'`.

`QuotationList` picks its endpoint from `route.name`
(`preliminary` / `sent` / all) and its title the same way. Note that
`quotation-add` passes **no** `pk`, `quotation-edit` and
`quotation-edit-preliminary` pass one; `QuotationDetail` is the only mount of
`QuotationForm` with `is-view=true`.

## Behaviour worth pinning (before moving code)

1. **Chapter ordering and the replace-set scope.** Costs and lines are read and
   written per chapter: `GET /api/quotation/cost/?quotation=&cost_type=&chapter=`
   and `GET /api/quotation/quotation-line/?chapter=`. A save posts one bare
   array to `/api/quotation/cost/quotation/{quotation_id}/{cost_type}/?chapter=`
   or `/api/quotation/quotation-line/chapter/{chapter_id}/`; "absent from the
   list" means delete, so the `chapter` filter is what stops one chapter's save
   deleting another's rows. (Already pinned by
   `quotation-replace-set-call-shape.spec.js`.)
2. **Totals and VAT.** Line total = `price × amount`; VAT = `total ×
   round(vat_type)/100` (the legacy models truncate the rate with `parseInt`,
   and `QuotationLineModel.calcTotal` uses `parseInt(this.vat_type)`); a
   chapter total sums its lines, a quotation total sums its chapters. The
   duration cost types total `price × amount_duration_secs / 3600`, the scalar
   types `price × amount_int`, materials `price × amount_decimal`.
3. **Adding panel rows to the chapter lines** (`createQuotationLines`): three
   options — `user_totals` (one line per cost row), `total` (one line whose
   amount is the summed amount and whose price is `0.00`, `price_text '*'`),
   `none` (nothing). Only offered while the chapter has no lines of that type.
4. **Offer creation.** `OfferForm` opens with one `get_unsent_offer` request
   that answers the offer, the quotation and its documents; a new offer is
   POSTed, a stored one PATCHed; success requires `is_sent` on the answer,
   otherwise an error toast and no navigation. (Pinned by
   `offer-form.spec.js`.)
5. **PDF generation.** Preliminary quotations generate a preview; definitive
   ones download the definitive PDF. Generating answers with the fresh
   quotation (filename included) and shows an error modal when the blob is not
   a PDF. (Pinned by `quotation-pdf-viewer.spec.js`.)
6. **List modes.** The mode follows `route.name`; a mode switch keeps the
   search term and page but changes the endpoint and title.
7. **Make definitive** is offered only on preliminary quotations and only from
   the form (`isView=false`).

## What becomes shared: `src/features/costing/`

The cost-collection machinery is genuinely the same concept on both slices:

| concept | invoice | quotation |
|---|---|---|
| the row type + defaults | `form/use-cost-collection.ts` `CostRow`, `makeCostRow` | `models/quotations/Cost.js` `CostModel` |
| the collection composable | `useCostCollection` | the cost half of `quotation_form/mixin.js` per panel |
| the shell chrome | `panels/CostCollectionShell.vue` | hand-rolled in each panel's `v-if` branches |
| the stored table | `panels/CostsTable.vue` | `quotation_form/CostsTable.vue` |
| the total row | `panels/TotalRow.vue` | `quotation_form/TotalRow.vue` |
| the VAT select | `panels/VAT.vue` | `quotation_form/VAT.vue` |
| the column label | `panels/Header.vue` | `quotation_form/Header.vue` |
| "add to lines" | `panels/AddToInvoiceLinesDiv.vue` | `quotation_form/AddToQuotationLines.vue` |
| the save button | `panels/CollectionButton.vue` | hand-rolled |
| the pricing maths | `form/calculations.ts` | `CostModel.getTotal`, `QuotationLineModel.calcTotal`, `priceMixin` |

They differ in exactly three seams:

1. **What the costs hang off and where the replace-set goes.** Invoice costs
   carry `order`; quotation costs carry `quotation` and `chapter`, and the
   replace-set is scoped by `?chapter=`. This is a per-consumer "collection
   endpoint" strategy.
2. **Whether the server prices the rows.** The order cost replace-set prices
   each row server-side and answers without needing `vat`/`total` in the
   request; the quotation cost endpoint takes `vat` and `total` in the row (the
   legacy quotation Cost model does not price itself in `save()`). Both now
   *send* the whole row set and adopt the answer.
3. **What "add to lines" produces.** Invoice lines and quotation lines are
   different resources with a different panel; the panel hands the drafts to a
   callback either way.

So the shared unit is the **cost collection** (row, composable, shell, table,
total row, VAT, header, save/remove control, "add to lines" radio, and the
pricing maths), and the two seams above are supplied by the consumer. The line
panel itself (chapters, `QuotationLine`) stays quotation-only; the invoice line
panel stays invoice-only.

Decision: extract `src/features/costing/` with invoice as the only consumer
first, prove invoice unchanged, then build quotation on it. If the quotation
side turns out to differ in essence, keep it local and say so.

## Order of work

1. This document.
2. Extract shared costing (invoice-only consumer) as its own commit; prove
   invoice unchanged (invoice specs run unchanged, rendered HTML diffed).
3. Migrate the quotation screens one by one: list → view/pdf → customer → form
   → lines → offer.
4. Delete `views/quotations`, `models/quotations`, the mixin.
5. `npm run lint`, `lint:i18n`, `typecheck`, `test`; Stryker on the new
   calculation files.
6. Summary (the guide's COMPLETION section).

## Suspected defects (verify before deciding preserve vs. fix)

1. **`QuotationList` `TableStatusInfo`** receives `quotationStatuscodeService`
   and `statusService`, both `new` per component — preserved as-is until the
   list is rewritten; the shared status cell is `features/shared`.
2. **`quotation-add` route has no `pk`**, yet the form's submit path calls
   `quotationService.insert`. Preserved.
3. **`submitQuotation` early-returns without a toast when the data component is
   invalid** — it reads `this.v$.$invalid` (the *form's* own, empty rules)
   rather than the child's. Preserved unless a spec says otherwise.
4. **`Hours.vue` normalises durations through `moment`** then rounds the
   summary hours (`toFixed(0)`), where the invoice `HoursPanel` keeps the
   minutes. The quotation total line's amount is that rounded hours figure.
   Preserved as the quotation's own behaviour.
5. The legacy `Cost.js` `getTotal()` reads `COST_TYPE` from the module scope
   without importing it (it relies on a global) — a latent `ReferenceError` for
   any path that calls it before `COST_TYPE` is defined. The rewrite removes
   the class.
