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
