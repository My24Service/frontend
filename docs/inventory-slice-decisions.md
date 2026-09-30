# Inventory slice — decisions made while the user was away

Each entry: the fork, what was chosen, and why. Written as the work goes,
not at the end.

## Baseline (branch `feature/refactor-inventory-slice`, cut from `develop` at `8b7ce27f`)

Run before any change, so no pre-existing failure is counted as a regression.

- `npx vitest run`: 222 files, 2720 tests; **5 fail**, all outside the slice:
  - `features/auth/login-form.spec.js` — "a filled username with no password flags only the password"
  - `features/order/order-form.spec.js` — "branch employee create > reads the seed for their own branch…"
  - `features/order/order-list.spec.js` — "the start-date filter rides the wire under its bare name…"
  - `features/order/temps-form.spec.js` — "a failed create toasts and keeps the form"
  - `features/member/member-form.spec.js` — "opens on the member it was given, headed Edit member"
- `npx vue-tsc --noEmit`: clean.
- `pnpm run build`: clean.
- `pnpm run lint` (run once the user's cache refresh finished): **6 errors**,
  all outside the slice — 1 in `features/order/form/DateTimeFields.vue`
  (unbound method), 5 in `features/workforce/time-registration/TimeRegistration.vue`
  (unsafe member access on `.item`).
- `pnpm run lint:i18n`: clean.

## Consumers outside the slice

- No source file outside `src/views/inventory/` imports `src/models/inventory/*`,
  including `Material.js`. **No shim is needed**: the models are deleted with
  the views.
- Two model specs import the legacy models:
  `tests/unit/models/inventory-schema-fields.spec.js` pins the legacy models'
  form defaults and write shapes, so it goes with them.
  `tests/unit/models/generated-schema-defaults.spec.js` uses
  `StockLocationSchema` only as a sample subject for the `models/schema`
  seam. It keeps testing that seam against `lenient(vStockLocation)` built
  in the spec, so the seam loses no coverage.

## Plan

### Target layout

```
src/features/inventory/
  index.ts            the one door (the router imports the .vue files directly)
  README.md           layout, what is shared, wire contracts, the ledger
  material/           MaterialList, MaterialView, MaterialForm, schemas.ts
  supplier/           SupplierList, SupplierView, SupplierForm, schemas.ts
  stock-location/     StockLocationList, StockLocationView, StockLocationForm, schemas.ts
  mutation/           MutationList, MutationForm, MaterialMoveForm,
                      use-stock-pickers.ts (in-stock material search, a material's locations)
  material-rows/      the staged material rows a purchase order and a reservation
                      both edit and save as one with-materials replace-set:
                      use-material-rows.ts, MaterialRowsPanel.vue (picker + row editor
                      + table), MaterialRowsTable.vue (read-only, used by the views)
  purchase-order/     list/ (PurchaseOrderList + status modal), detail/ (PurchaseOrderView),
                      form/ (PurchaseOrderForm shell, PurchaseOrderSupplierFields, schemas.ts)
  entry/              PurchaseOrderEntryList, PurchaseOrderEntryView,
                      form/ (PurchaseOrderEntryForm shell, use-entry-rows.ts,
                      EntryRowsPanel.vue, schemas.ts)
  reservation/        SupplierReservationList, SupplierReservationView,
                      SupplierReservationForm, schemas.ts
  stats/              InventoryStats, StatsTable
```

### What becomes shared, and at what scope

- **Inside the feature:** `material-rows/`. The purchase-order and reservation
  forms carry the same staged-rows code, line for line: a supplier-scoped
  material picker, amount > 0, remarks, add/edit/delete, and the whole set
  sent in the parent's `with-materials` body. Both consumers are inventory
  forms, so this is the narrowest scope that fits. `use-stock-pickers.ts`
  plays the same role for the mutation and move forms.
- **Shared kits, used as they are:** the table kit (`ServerTable`,
  `useServerTable`, `createActionColumn`, `WHOLE_COLLECTION_PAGE_SIZE`), the
  forms kit (`useResourceForm`, `writeContract`, `ValidatedForm`/`Field`,
  `useSearch`, `useQueryErrorToast`) and `useFileDownload` for the stats
  export.
- **No shared-kit extraction is planned up front.** Nothing in the slice
  duplicates a concept that another feature already has in a local copy.
  If one turns up during the migration, it gets its own commit before the
  screen that needs it.

### Order of commits

Lists, then detail views, then the simple forms (material, supplier, stock
location), then mutation and move, then stats, then the material-rows forms
(purchase order, reservation), then the entry form. The router, the
deletions, the READMEs and the COMPLETION summary come last.

## Forks

- **Pickers search on typing; an empty term reads nothing.** The legacy
  pickers fired one `q=` read on mount. `useSearch` asks for nothing until a
  term is typed. The field-service slice already records this as the
  codebase's behaviour, and adding a flag to the shared kit for one slice
  would go against the guide. Exceptions: pickers whose options are a
  bounded list rather than a search (the move form's destination locations,
  a material's locations) read the whole collection once.
- **The mechanical screen work is delegated to Sonnet subagents**, per the
  user's instruction, one screen group each, with a written brief. I review
  every diff, run the checks and write the commits myself. The subagents
  neither commit nor touch the router or the feature's root `index.ts`.
- **The subagents split by concept, not by screen type.** They work in
  parallel in one working tree, so each owns whole folders (material +
  supplier + stock location; mutation + move + stats; purchase order +
  reservation + material rows; entries). That way no two of them write the
  same `index.ts`. The commits still go lists → views → forms: I stage each
  concept's files by screen type.
- **`generated-schema-defaults.spec.js` builds its own `lenient(vStockLocation)`**
  instead of importing it from the legacy model. Committed on its own, ahead of
  the deletion (all 17 tests unchanged).

## API contract

- **Fixed the backend schema for `GET /api/inventory/purchaseorder/{id}/`**.
  It was documented as `PurchaseOrderList`, but `DetailSerializerMixin`
  answers with `PurchaseOrderDetail`, which has the materials, reservation
  materials, entries and statuses. Found by the entries subagent. The fix is
  schema-only, on my24service `feature/purchase-order-retrieve-schema`
  (commit `3912acc0`, worktree `../worktrees/backend-purchase-order-retrieve-schema`,
  cut from `develop`). The regenerated diff is that one `$ref`. **Needs
  merging before this branch ships.**
