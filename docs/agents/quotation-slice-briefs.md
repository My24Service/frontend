# Quotation slice — screen briefs

Four ready-to-run briefs for the screen migration, written before the
subagents stalled. Each is self-contained: paths, contracts, legacy behaviour
to preserve, and the verification commands.

**Run them one or two at a time, not four.** Four concurrent agents produced no
output at all. After ~2 minutes with no progress, check
`git status --short` — if nothing has appeared, cancel and relaunch serially.

Shared ground rules for every brief:

- Stay on `feature/refactor-quotation-slice`. Do not switch branches.
- Read the legacy file for behaviour, but never edit `src/views/`,
  `src/models/` or `src/router/`. Do not touch another agent's subfolder.
- Read `docs/quotation-slice-handoff.md` and
  `docs/quotation-slice-characterisation.md` first.
- Build on `src/features/costing/` (`@/features/costing`). Do not fork it.
  Extend it only if something is genuinely missing, and say so in the report.
- `import * as Api from '@/services/api-client'` (value and type in one name).
- Data through TanStack Query and the generated resources. No manual fetch.
- Labels are `$trans('literal')` (the i18n lint requires the literal).
- Harness: `tests/unit/support/form-harness.js` (`mountForm`, `mountListView`,
  `toasts`, the `bootstrap-vue-next` toast mock), `tests/unit/support/api-seam/index.js`
  (`installApiSeam`, strict schema-validated stubs).
- Verify: specs green, `pnpm run lint -- <your files>` clean,
  `pnpm run typecheck` with no errors in your files.

---

## Brief A — list

Only `src/features/quotation/list/` and `tests/unit/features/quotation-list.spec.js`.

Legacy: `src/views/quotations/QuotationList.vue` (303 lines).
Pattern: `src/features/invoice/list/InvoiceList.vue` +
`tests/unit/features/invoice-list.spec.js` (ServerTable, `urlSync`, delete modal
via the resource).

API: `Api.QuotationQuotation` / `…Preliminary` / `…Sent` (`.listOptions`; check
derived filters in `resources.gen.ts`), `Api.StatuscodeStatuscode.list` with
`code_type: 'quotation'` and `WHOLE_COLLECTION_PAGE_SIZE`.

Preserve: three modes by `route.name` (`quotation-list` = Definitive,
`preliminary-quotations` = Preliminary, `quotations-sent` = Sent) with the pills
nav; columns Name, Customer, Reference, City, Total, Vat, Status, icons; row
links — preliminary → `quotation-edit-preliminary`, definitive unsent →
`quotation-view`, sent → `quotations-sent-view`, each `{params:{pk}}`; icons —
preliminary && !is_sent → edit (`quotation-edit`) + delete, !preliminary →
create-order (`order-add-quotation`, `{params:{quotation_id}}`) + send
(`quotation-send`, `{query:{quotationId}}`); delete = confirm modal, destroy,
refetch, toasts 'Quotation has been deleted' / 'Error deleting quotation',
preliminary rows only; status column — read `src/features/shared/use-status-cell.ts`
and `src/features/invoice/list/InvoiceStatusCell.vue` first and say which you used
and why.

## Brief B — detail

Only `src/features/quotation/detail/` and `tests/unit/features/quotation-detail.spec.js`.

Legacy: `src/views/quotations/QuotationView.vue` (285 lines).
Pattern: `src/features/invoice/detail/InvoiceView.vue` +
`tests/unit/features/invoice-detail.spec.js` (legacy-markup snapshot parity,
generated detail query, dineros via `toDinero`).

API: `Api.QuotationQuotation.retrieve`, `Api.QuotationChapter.list`
(`?quotation=`), `Api.QuotationQuotationLine.list` (filters `chapter`,
`quotation`). Documents: reuse `DocumentCollectionEditor` +
`quotationDocumentResource` from `@/features/documents` exactly as
`src/views/quotations/quotation_form/DocumentsComponent.vue` already does —
do not reimplement. Company logo: use whichever source `InvoiceView` uses
(`mainStore.getMemberLogo`).

Reads: quotation, then chapters, then lines per chapter — parallelise where the
dependency is not real, and note what you changed.

Preserve: member logo block; quotation number/reference rows; customer block
(id, name, address, country-postal + city, expire days, created, modified,
definitive date, contact); per-chapter `<h4>` + lines table
(Info/Amount/Price/Total/VAT, `formatMoney` on dineros); 'Quotation total'
`TotalsInputs`; documents + statuses two-column row; header breadcrumb to
`quotations-sent`, `<id> <name>`, View PDF (viewer's exposed `show()`), Send
quotation (`{name:'quotation-send', query:{quotationId}}`); failed read toasts
and renders nothing.

Note: Brief C builds `src/features/quotation/pdf/` and `…/customer/` in
parallel. Import `QuotationPDFViewer` from `@/features/quotation/pdf` and
`QuotationCustomerView` from `@/features/quotation/customer`; if those barrels
are not there yet, stub them **in your spec**, never in the component.

## Brief C — pdf, customer, offer

Only `src/features/quotation/pdf/`, `…/customer/`, `…/offer/` and
`tests/unit/features/quotation-pdf.spec.js`, `…/quotation-offer.spec.js`. You may
delete `tests/unit/views/quotations/offer-form.spec.js` and
`…/quotation-pdf-viewer.spec.js` once their assertions are carried over.

Legacy: `QuotationPDFViewer.vue` (262), `CustomerView.vue` (103),
`OfferForm.vue` (242). Patterns: `src/features/invoice/pdf/InvoicePDFViewer.vue` +
`invoice-pdf.spec.js`; `src/features/invoice/email/EmailForm.vue` + `schemas.ts`
+ `invoice-email.spec.js` (offer's twin). `docs/agents/form-schemas.md` governs
`offer/schemas.ts`.

API: `Api.QuotationQuotation.extras.{generateDefinitivePdfCreate,
downloadDefinitivePdfCreate, generatePreviewPdfCreate, makeDefinitiveCreate}`
(verify the generated names). `Api.QuotationOffer` for the writes; the unsent
offer read is in `QuotationOffer.reads` as `quotationOfferGetUnsentOfferRetrieve`
— find how it is exposed and note the query param (`get_unsent_offer/?quotationId=`).
`decodePdfError` / `downloadBlob` from `@/features/shared`.

Preserve: PDF viewer — three modals (pdf-error; make-definitive confirm only when
`!isView`; xl viewer), preliminary → preview blob else definitive blob, `show()`
loads the blob then opens the viewer or the error modal, buttons Make definitive
(preliminary) / 'Recreate PDF' (definitive) / Download PDF (when
`definitive_pdf_filename`), `doMakeDefinitive` toasts 'Quotation is now
definitive' and pushes `quotation-view`, `generatePdf` adopts the fresh
quotation then fetches the blob and toasts 'PDF created', iframe load and
unmount release the object URL. Keep the legacy copy verbatim.
CustomerView — read-only rows (Customer, Customer ID, Address, Postal as
`country-postal`, City, Contacts, Email, Mobile, Phone) with the `checkValue`
`-` fallback; pure presentational component, prop typed off the generated record,
no mixin. OfferForm — opens with the one `get_unsent_offer` (offer + quotation +
documents); no offer → a new one addressed to the quotation with
`recipients = [quotation_email]` (not `['']`); tag validation plus at least one
recipient; subject required with the generated max length kept; one `submitForm`
doing POST or PATCH; the answer must carry `is_sent` else error toast 'Error
sending quotation' and no navigation; success toasts 'Quotation has been sent' and
pushes `quotations-sent`; attachments with the per-PDF 'Preview quotation PDF'
button downloading the binary as `quotation-<id>.pdf`.

## Brief D — form panels

Only `src/features/quotation/form/panels/` and
`tests/unit/features/quotation-cost-panels.spec.js`, `…/quotation-lines.spec.js`.
You may delete `tests/unit/views/quotations/quotation-replace-set-call-shape.spec.js`
and `…/quotation-materials-create-call-shape.spec.js` once carried over.

Legacy: `quotation_form/{Hours,Distance,CallOutCosts,MaterialsCreate,Chapter,QuotationLine}.vue`,
`mixin.js` (esp. `costRow`, `replaceCostRows`, `createQuotationLines`),
`CostsTable`, `TotalRow`, `VAT`, `AddToQuotationLines`,
`EmptyQuotationLinesContainer`, `SectionHeader`, `Header`, `constants.ts`.
Patterns: `src/features/invoice/form/panels/HoursPanel.vue` and
`DistancePanel.vue` for the wiring, `tests/unit/features/invoice-cost-panels.spec.js`
for the spec shape (`installApiSeam`, `mountForm`, a `Parent` that provides the
context, `click`/`typePrice` helpers, the "panel outside a form refuses to
mount" test).

Contracts, fixed — the form shell (built separately) provides:
`provideCostPanelContext({parentPk, engineers, lines, linesCreated,
emptyCollectionClicked})` from `@/features/costing`; panels call
`useCostPanelContext()`, which throws outside a form. Each panel calls
`useCostCollection({context, source: useQuotationCostSource(quotationPk,
chapterId, costType), costType, currency, buildRows, description, title, amount})`
from `@/features/quotation/form/quotation-cost-source.ts` and
`…/calculations.ts` (`previewQuotationLine`, `sumChapterTotals`,
`hydrateQuotationLinePrices`). Line drafts go back through
`context.linesCreated(drafts)`; the line-type values from `createInvoiceLines`
('work', 'travel', 'extra-work', 'actual-work', 'used-materials', 'distance',
'call-out-costs') are exactly the legacy quotation constants — verify against
`quotation_form/constants.ts`.

API: `Api.QuotationCost.list` (quotation + chapter + cost_type),
`Api.QuotationCost.extras.quotationCreate` (path `{quotation_id, cost_type}`,
query `{chapter}`, bare array body), `Api.QuotationQuotationLine.list`,
`Api.QuotationQuotationLineChapter.create` (path `{chapter_id}`, body =
`vQuotationQuotationLineChapterCreateBody`, an array of
`vQuotationLineRowRequest`), `Api.QuotationChapter`,
`Api.InventoryMaterialAutocomplete` (verify the name; the legacy
`MaterialService.searchNoSupplier` GETs `/inventory/material/autocomplete/?q=`)
and the material retrieve for the selling price.

Preserve per cost panel (hours `work_hours`/`travel_hours` by `type`; distance;
call-out; materials with the autocomplete):
- `SectionHeader` with the title, a check icon when lines of the type exist, and
  `scrollToHeader()` on create; `<details open>` when `isView`.
- Lines of this type present → read-only `CostsTable` + `<hr/>` +
  `EmptyQuotationLinesContainer` 'Remove quotation lines' →
  `context.emptyCollectionClicked(type)`.
- Otherwise editable rows: the row editor (duration / km / amount / material
  search + amount), `PriceInput`, VAT select, readonly VAT and Total inputs,
  a per-row 'Delete cost'; 'Add <…>' disabled while an empty row exists;
  'Save changes' disabled unless something changed; `TotalRow`; `AddToLinesDiv`
  with the quotation copy ('What to add as quotation lines' /
  'Create quotation lines' — pass them as the props
  `src/features/costing/panels/AddToLinesDiv.vue` declares).
- Save: ONE replace-set POST. Bare array; rows carry `chapter`, `vat`, `total`
  and the `*_currency` companions; they must **not** carry `quotation` or
  `cost_type`. Adopt the answer's ids and totals. Toasts per the legacy copy
  ('Materials costs have been updated', 'Distance costs updated', …). A 400
  toasts the error with no per-row fallback.
- Materials: new rows start material-less (`isEmpty` = `material === null`),
  save filters empty rows out, stored rows are named from the cost list (no
  per-material GET), and picking a material reads its detail once and seeds
  `price_selling_ex`.
- Hours: normalise the duration on change, `totalHours` feeds the 'total' line's
  amount, and the edit must not be written back into the shared bootstrap.
- Defaults: `mainStore.getQuotationDefaultHourlyRate` (hours),
  `getQuotationDefaultPricePerKm` (distance),
  `getQuotationDefaultCallOutCosts` (call-out), `getQuotationDefaultVat`,
  `getDefaultCurrency`.

`ChapterPanel.vue` — the quotation's chapters (`?quotation=`), a table with
load / edit / delete (the delete modal inline with `b-modal`, as legacy), an
add/edit form with a required name, typed `chapter-created` / `chapter-loaded`
emits, and the new-chapter form opening automatically when the list is empty.

`QuotationLinePanel.vue` — the chapter's lines; the table (info + amount /
total + VAT + rounded vat_type / edit + delete icons); the add/edit form
(amount, `PriceInput`, VAT, info, extra_description, live `TotalsInputs` from
`previewQuotationLine`); validity = info non-empty and amount non-empty and
non-zero; the chapter total row from `sumChapterTotals` + `hydrateQuotationLinePrices`;
the staged-changes block (discard reloads, save posts ONE bulk set through
`QuotationQuotationLineChapter.create` with the ids, the currency companions when
present, and no `quotation`/`chapter` keys); `defineExpose({lines, addLines,
removeLinesForType, saveCollection, getLines})` for the shell, plus
`lines-loaded` / `lines-changed` emits.
