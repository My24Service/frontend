# The Quotation Slice

The quotation screens: the three lists (definitive, preliminary, sent), the
read-only PDF-shaped view, the PDF viewer, the send-quotation (offer) form,
and the quotation form — create/edit with its customer and details, then
chapter by chapter, each chapter's lines and its costs (materials, work and
travel hours, distance, call-out costs). The `quotation-detail` route is the
same form, read-only.

This directory follows the Member Slice (`src/features/member/`, the
reference implementation) and the Customer Slice's README shape. The
reasoning behind the split is in `docs/quotation-slice-characterisation.md`;
the calls made along the way are in `docs/quotation-slice-decisions.md`.

## Layout

```
index.ts                 the one door
QuotationDocuments.vue   the document editor with the quotation endpoint (form and view)
list/                    QuotationList on the table kit, QuotationStatusCell
detail/                  QuotationView and its reads (use-quotation-detail.ts)
pdf/                     QuotationPDFViewer (exposes show())
customer/                QuotationCustomerView, the read-only customer block
offer/                   OfferForm (send quotation) and its schema
form/
  QuotationForm.vue          the shell: useResourceForm, header, the three columns
  QuotationCustomerFields.vue  customer search + address block
  QuotationDetailsFields.vue   name, reference, expiry, description (or read-only)
  ChapterWorkspace.vue     one chapter opened: lines left, costs right; provides
                           the cost-panel context
  schemas.ts               the form's write contract (vQuotationRequest, picked)
  calculations.ts          quotation pricing and line maths (pure, specced)
  quotation-cost-source.ts the quotation's CostCollectionSource
  use-quotation-costs.ts   one cost type of one chapter (on useCostCollection)
  use-quotation-lines.ts   one chapter's staged lines and their replace-set
  panels/                  ChapterPanel, QuotationLinePanel (+ QuotationLineEditor),
                           QuotationCostPanel (the frame) and the four cost panels
```

## What is shared, and with whom

- **`src/features/costing/`** — the cost-collection machinery, extracted from
  the invoice form with invoice as its first consumer. The quotation uses the
  list read and draft/stored reconcile, the totals, price and VAT editing,
  the stored-costs table, the total row, the VAT select and the "add to lines"
  radio. What the quotation added there, all without changing invoice
  behaviour (the invoice specs pass unchanged): the panel context is generic
  in its line-draft type, `useCostCollection` exposes `adoptStored` and
  `costAmountOf` and takes a context without `linesCreated`,
  `costTypeForLineType` inverts `invoiceLineType`, and `CostsTable` shows the
  user column only when a row names one.
- **Quotation-only**: the chapter scope; client-side pricing (the quotation
  cost endpoint stores the `total`/`vat` it is sent, the order's prices its
  rows); free add/delete of cost rows; quotation-line drafts that keep the VAT
  rate and material; "remove quotation lines" keeps the costs.
- **`src/features/table/`** — `useListModeReset`, moved out of the invoice
  list, used by both lists.
- **`src/features/forms/`** — `EmailRecipientsField`, `sendableRecipients`,
  `sendableSubject`, `SEND_FIELD_*`, moved out of the invoice e-mail form,
  used by it and the offer form.
- **`src/features/shared/`** — `useStatusCell`/`StatusCell`, `decodePdfError`,
  `downloadBlob`, `StatusesComponent`.

## Wire contracts worth knowing

- **Replace-sets are chapter-scoped.** Costs:
  `POST /api/quotation/cost/quotation/{quotation_id}/{cost_type}/?chapter=`;
  lines: `POST /api/quotation/quotation-line/chapter/{chapter_id}/`. Both take
  a bare array; a stored row left out is deleted. The `chapter` query on the
  cost save is what stops one chapter's save deleting another's rows.
- **Cost rows carry `vat` and `total`** (and the `*_currency` companions),
  never `quotation` or `cost_type`. Line rows carry neither `quotation` nor
  `chapter`.
- **Stored lines keep the cost type in `cost_type`** (`work_hours`, not the
  invoice line type `work`); `lineTypeOfQuotationLine` maps them for the
  shared "this type already has lines" check.
- **The PDF endpoints are binary.** The backend schema was corrected on
  my24service `feature/quotation-pdf-schema`.

## Declared exceptions — the ledger

| Screen(s) | Exception | Why |
|---|---|---|
| List | Status picks invalidate the lists | The legacy cell never refreshed the row |
| List | "Create order" is a link, not a click handler | Same destination, a real href |
| View | Chapters and lines are read in parallel with the quotation; the lines in one `?quotation=` read grouped by chapter, whole collection | The legacy per-chapter reads used the default page and dropped a chapter's 21st line |
| View | The markup is byte-identical to the legacy view | Proven before the snapshot was taken |
| View, form | The timeline is empty / gone | The quotation record carries no `statuses`; the view keeps the empty block for layout, the form's never-shown one is dropped |
| PDF viewer | The preview URL lives until replaced or unmounted | Revoking on iframe load broke the browser viewer's save/print |
| PDF viewer | "Make definitive" is hidden on the view | Its confirm modal only exists off the view; the button did nothing |
| PDF viewer | A failed make-definitive toasts once | It toasted twice |
| Offer | Subject copy is the forms kit's ("Please enter a subject") | The field is a `ValidatedFormField`, like the invoice e-mail's |
| Offer | The attachment saves as `quotation-<number>.pdf` | Was `quotation.pdf` |
| Form | A cleared text field is sent as `null` (PATCH of the form's fields only) | The legacy dropped blanks, so a field could not be cleared |
| Form | "Submit and recreate PDF" is gone | It could never render (it required a definitive quotation inside a block shown only for preliminary ones); "Recreate PDF" in the viewer does the job |
| Form | A create toasts "Quotation has been created" | `useResourceForm`'s create path; the legacy create was silent |
| Chapters | Create and edit failures toast | They failed silently |
| Cost panels | The VAT select shows the row's own rate | It always showed the default, whatever the row stored |
| Cost panels | On the view, and once lines of the type exist, the costs are a read-only table | The view showed editable rows with hidden inputs and live save buttons |
| Cost panels | A save adopts the answer; no list re-read | As the legacy panels after the replace-set change |
| Cost panels | An "items" hours line's amount is the typed duration | The legacy row kept `0:00` because the duration edit never updated the display value |
| Cost panels | The materials amount input shows the stored amount | It started blank |
| Cost panels | Stored hours have no "User" column | Quotation hours name nobody |
| Cost panels | Total row layout is the shared one | One component for both slices |
| Lines | "N quotation lines added" | Said "invoice lines" |
| Lines | A line needs info and a finite, non-zero amount | The legacy check read a `description` field lines do not have, so only "not 0" held |
| All | Embedded reads ask for the whole collection (`page_size=1000`) | Chapters, lines, statuscodes: see the Customer Slice's *whole-collection bound* |

Schema strengthenings (case 2, `docs/schema-strengthenings.md`): the offer's
send rules (entry 8) and the form's required customer and name (entry 9).

## Tests

`tests/unit/features/quotation-*.spec.js`: list, detail (markup snapshot),
customer (markup snapshot), pdf, offer, form, lines (lines + chapters),
cost-panels, calculations. The calculation numbers were characterised
against the legacy `CostModel` before it was deleted.
