# Quotation slice — decisions made while the user was away

Each entry: the fork, what was chosen, and why. Read with
`docs/quotation-slice-characterisation.md` and
`docs/agents/quotation-slice-handoff.md`.

## Process

- **Ran the screen briefs inline, not as subagents.** The handoff recorded
  four parallel subagents stalling with no output; doing the screens in one
  session removes that risk and keeps one consistent view of the shared seams.
- **No Stryker.** The user reported mutation testing is currently broken.
  The calculation files are covered by unit specs instead.

## List

- **`useListModeReset` moved into the table kit.** The invoice list had an
  inline `watch(route.name)` that resets the page on a mode switch; the
  quotation list needs the identical behaviour. Two consumers, same concept,
  so it lives in `@/features/table` and the invoice list uses it (its specs
  pass unchanged).
- **Status column: a `QuotationStatusCell` on `useStatusCell`**, the
  invoice's pattern (disabled automatic codes, invalidate the list after a
  pick). The legacy list disabled codes with a `settings_key`; that is the
  `isDisabledOption`. The legacy cell never refreshed the row; the new one
  invalidates the quotation lists, like the invoice cell.
- **"Create order" is a `RouterLink`, not a `BLink` with a click handler.**
  Same destination, a real href, one less method.

## API contract

- **Fixed the backend schema for the two PDF endpoints** instead of working
  around it. `download_definitive_pdf` and `generate_preview_pdf` answer
  with the PDF, but the schema said JSON `Quotation` (and a `QuotationRequest`
  body), so the generated ops would parse a PDF as JSON. The backend change
  mirrors the invoice's annotations exactly and is schema-only:
  `my24service` branch `feature/quotation-pdf-schema` (commit `c52ae40b`,
  worktree `../worktrees/backend-quotation-pdf-schema`, cut from `develop`).
  **It needs merging before this frontend branch ships**, or the running
  backend's behaviour is unchanged anyway (only the schema text changed), so
  the order is not critical — but the checked-in `openapi/schema.yaml` now
  reflects that branch.

## View, PDF, customer

- **The view reads chapters and lines in parallel with the quotation**, and
  the lines in one `?quotation=` read grouped by chapter (whole collection)
  instead of one read per chapter on the default page — the legacy reads
  silently dropped a chapter's 21st line. The markup is byte-identical to the
  legacy view (proven in `quotation-detail.spec.js` before the snapshot).
- **The timeline on the view is always empty**: the quotation record carries
  no `statuses` (only the generate-PDF answer, `QuotationDetail`, does). Kept
  for layout parity rather than adding a read; worth a backend look.
- **PDF viewer departs from legacy in three places, all bugs**: the preview
  URL is not revoked on iframe load (the browser's PDF viewer still needs it
  to save/print; the invoice viewer already fixed this), "Make definitive" is
  hidden when `isView` (its confirm modal does not exist there, so the button
  did nothing), and a failed make-definitive toasts once instead of twice.
- **`QuotationDocuments` lives at the feature root**, not in `form/`, since
  the view and the form both use it.

## Offer

- **The recipients field, the two send rules and their copy moved into the
  forms kit** (`EmailRecipientsField`, `sendableRecipients`,
  `sendableSubject`, `SEND_FIELD_*`) and the invoice e-mail form uses them
  too; its HTML is byte-identical before/after. Recorded as ledger entry 8
  in `docs/schema-strengthenings.md` (it was missing for the invoice too).
- **Subject copy is the forms kit's** ("Please enter a subject") rather than
  the legacy "Please enter the email subject", because the field is now a
  `ValidatedFormField` like the invoice e-mail's.
- **The attachment button saves `quotation-<quotation_id>.pdf`**, like the
  PDF viewer's download, instead of the legacy bare `quotation.pdf`.

## Form, chapters, lines and costs

- **Costing stays shared, but the quotation panels are their own.** The
  invoice panels build drafts from order activity and show "stored or draft";
  the quotation panels edit a free list of rows. So the shared unit is the
  collection (`useCostCollection`) and the small pieces (table, total row,
  VAT, add-to-lines); the four quotation panels share one quotation-only
  frame (`QuotationCostPanel` + `useQuotationCosts`) instead of four copies.
  `CostCollectionShell` is not used by the quotation — it is the invoice's
  stored-vs-draft chrome.
- **The shared save stays the invoice's.** Its specs pin the post-save list
  re-read, while the quotation's pinned "adopt the answer, no re-read". Rather
  than a flag, `useCostCollection` exposes `adoptStored` and the quotation's
  save uses it.
- **Line drafts are the quotation's own shape**, not the shared
  `InvoiceLineDraft`: a quotation line keeps the VAT rate (rounded, as
  stored) and the material; adding those to the shared draft would have
  changed what the invoice sends. `CostPanelContext` became generic in its
  draft type instead.
- **Stored lines keep the cost type in `cost_type`** (`work_hours`), as the
  legacy code wrote them and as production data holds them. The briefs
  assumed the invoice line types; they were checked and are not what is
  stored. The workspace maps them for the shared "has lines" check.
- **"Remove quotation lines" keeps the costs**, as legacy — unlike the
  invoice's "Remove saved costs", which empties them.
- **The view mode shows costs read-only.** Legacy rendered editor rows with
  hidden inputs and live Delete/Save buttons on the read-only route.
- **`QuotationDetail.vue` is gone**; the router mounts the form with
  `isView: true`.
- **"Submit and recreate PDF" is dropped**: its `v-if` could never be true
  (definitive inside a block shown only for preliminary/new), and it relied
  on an undocumented `?recreate=1` query.
- **The form uses `useResourceForm`** with a write contract over
  `vQuotationRequest` (picked to the form's fields, required customer and
  name as case-2 strengthenings, ledger entry 9). After a create it opens the
  edit route; after an update it opens the PDF viewer, as legacy did.
- **Hours `amount_duration` is sent as typed (`H:MM`)**, as legacy; the
  seconds and the `H:MM` display are derived from it.
- **The customer label is written inline** rather than imported from the
  order feature, to keep the quotation feature free of an order dependency
  for a one-line formatter.
- **Test harness notes**: `fixtureFor` cannot fill an intersection schema
  (material autocomplete), so that fixture is written out; `settle()` hangs
  under fake timers, so debounced searches wait real time (550 ms).
