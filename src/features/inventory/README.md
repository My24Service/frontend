# The Inventory Slice

The inventory screens: materials, suppliers, stock locations, stock mutations
and the material move, purchase orders with their status and their entries
(booking in what was ordered), supplier reservations, and the two stats
screens. They are mounted by `src/router/inventory.js`, which lazy-loads each
`.vue` file directly.

This directory follows the Quotation Slice's shape. The calls made along the
way are in `docs/inventory-slice-decisions.md`.

## Layout

```
index.ts            the one door: the screens (the router lazy-loads each .vue file directly)
material/           MaterialList, MaterialView, MaterialForm (image via ImageUploadField), schemas.ts
supplier/           SupplierList, SupplierView (with the supplier's materials), SupplierForm, schemas.ts
stock-location/     StockLocationList, StockLocationView, StockLocationForm, schemas.ts
mutation/           MutationList, MutationForm, MaterialMoveForm, schemas.ts,
                    use-stock-pickers.ts (in-stock material search, a material's locations,
                    their labels, invalidateStock)
material-rows/      the staged products a purchase order and a reservation both edit:
                    use-material-rows.ts (on the forms kit's useStagedRows: the draft check
                    against the consumer's row schema, seeding, the body),
                    MaterialRowsPanel.vue (picker + editor + table; takes the product search),
                    MaterialRowsTable.vue (read-only, used by the two views)
purchase-order/
  list/             PurchaseOrderList, PurchaseOrderStatusModal (exposes show(id)),
                    PurchaseOrderProgressCell, schemas.ts (the status body)
  detail/           PurchaseOrderView
  form/             PurchaseOrderForm (the shell), PurchaseOrderSupplierFields, schemas.ts
entry/              PurchaseOrderEntryList, PurchaseOrderEntryView,
                    invalidation.ts (what an entry write makes stale, stock included)
  form/             PurchaseOrderEntryCreate (order pick + staged rows, one bulk create),
                    PurchaseOrderEntryEdit (one entry, useResourceForm),
                    use-entry-rows.ts (on the forms kit's useStagedRows), use-stock-locations.ts,
                    EntryRowsPanel.vue, EntryFields.vue (shared by the create's row editor and the edit), schemas.ts
reservation/        SupplierReservationList (+ ReservationMaterialsCell), SupplierReservationView,
                    SupplierReservationForm, schemas.ts
stats/              InventoryStats, StatsTable, total-sales.ts (the five modes, one typed table)
```

## What is shared, and with whom

- **`material-rows/`**, inside the feature. The purchase-order and reservation
  forms stage the same products (a supplier-scoped picker, amount at least 1,
  remarks) and save them in the parent's `with-materials` body. Each form
  passes its own generated row schema and hands the panel its own product
  search: the order searches `material/autocomplete/`, as it always did. The reservation searches its supplier's catalogue
  (`material/?supplier_relation=`), because the autocomplete answers only
  materials with a price row for the current year.
- **`mutation/use-stock-pickers.ts`**, inside the feature: the in-stock
  material search and a material's locations, shared by the mutation and move
  forms.
- **`src/features/forms/`**, extended:
  - `useStagedRows` moved here from the order form. The trip form already
    reached into the order feature for it, and the material rows and the
    entry rows were two more copies of the same editor. The order panels, the
    trip form and both inventory row sets are built on it.
  - `nextWorkingDay` moved here from the order form, because the purchase
    order's expected date defaults to it too.
  - `useResourceForm` no longer fails a save silently when the body refuses
    what validation passed: the refusal lands on the field and in the save's
    error toast.
- **Used as they are**: the table kit (`ServerTable`, `useServerTable`,
  `createActionColumn`, `WHOLE_COLLECTION_PAGE_SIZE`), the forms kit
  (`useResourceForm`, `writeContract`, `ValidatedForm`/`Field`, `useSearch`,
  `useQueryErrorToast`, `useQueryOf`, `fieldsFromRecord`, `ImageUploadField`),
  `ListPageHeader` for the stats table, and `useFileDownload` for the stats
  export.

## Wire contracts worth knowing

- **Products are a replace-set.** `POST /purchaseorder/with-materials/` and
  `PATCH /purchaseorder/{id}/with-materials/` (and the reservation twins) take
  the whole `materials` list. A row with an `id` updates that stored row, a
  row without one is created, and a stored row left out is deleted.
  Products taken over from a reservation are therefore sent without ids.
- **Entries are booked in one request.** `POST /purchaseorder-entry/bulk/`
  takes a bare array. An edit PATCHes one entry and never sends a null
  `stock_location`, which the API rejects.
- **The purchase-order retrieve is the detail record**, with materials,
  reservation materials, entries and statuses. The schema said otherwise until
  my24service `3912acc0`.
- **The mutation summary is HTML**, built server-side, and the list renders it
  with `v-html` on purpose (see "Left open").
- **No inventory list declares `ordering`**, so the lists have no sortable
  columns. If the backend adds it, drop `enableSorting: false`.

## Declared exceptions: the ledger

| Screen(s) | Exception | Why |
|---|---|---|
| All lists | Search is the table kit's header field; no column sorts | Kit standard. The endpoints declare no `ordering`; the legacy headers sorted only the loaded page |
| All pickers | A search reads nothing until a term is typed | Recorded fork: the forms kit's `useSearch`, as elsewhere in the codebase |
| Material view | Its image style is scoped | `<style scope>` (a typo) sized every image in the app |
| Material form | A supplier left unpicked sends no `supplier_relation` | It sent `0` |
| Material form | Prices are checked against the generated decimal pattern; a cleared price is left out | They were sent and answered with a 400; the pattern matches `''`, which the API answers with a 400 too |
| Material form | The location is offered and sent only on an edit, and a location over 100 characters is refused before it is sent | The create body has no `location`, and the legacy offered it and lost it (see "Left open") |
| Supplier view | The supplier's materials are listed (whole collection) | The table had no items: they were read and never shown |
| Supplier view | Contact, phone, mobile and e-mail show | It read `order_*` keys a supplier does not have |
| Supplier form | Required lines read "Please enter a postal/city" | The forms kit's copy, as in the branch form |
| Supplier form | A country error shows under the select | It was validated with nowhere to show |
| Material, supplier and stock-location views | Both reads failing toast once | Two toasts with the same copy |
| Mutation list | No search field | The endpoint reads no `q`; the modal sent a parameter nothing read |
| Mutation, move | A save refreshes the stock reads | With a query cache the "in stock" figures would go stale |
| Move | The destination picker offers every stock location | It read the first 20 |
| Move | Submit/Bulk is disabled while a move is in flight | It could post twice |
| Move | In bulk mode, picking the next material focuses the amount | The focus ran before the input existed and threw |
| Mutation, move | The pickers track by `material_id`/`location_id` | `track-by="id"` matched no field on those rows |
| Mutation, move | Picking another material drops the location (the move's departure) picked for the first; bulk keeps its departure | A correction or move could book a material at a location that never held it |
| Mutation, move | An amount is read as a decimal: 0.5 is accepted, 0 is not | `parseInt` read 0.5 as nothing, although the decimal pattern and the serializer allow it |
| Mutation form | Submit is disabled while a create is in flight | It could post twice |
| Total sales | The per-customer column is headed "Customer" | It said "Supplier" |
| Stats, total sales | A load error toasts; a row with no name renders | Errors were swallowed and left the spinner up |
| Stats, total sales | Titles and chart legends are literal msgids with the year interpolated | `$trans('Total sales in ' + year)` and the legends' template strings never entered the catalogue |
| Total sales | Each mode is read per year | A year change dropped only the current mode's cache, so another mode showed last year's rows under the new title |
| Stats table | The search term belongs to the screen | It lived on a model singleton and carried over to the next visit |
| Stats table | Search, refresh and download are the table kit's list header; the search is debounced like the lists' | A search modal and a blank "icons" column held the buttons |
| Purchase order list | "Add status" posts to `purchaseorder-status/` | It posted to `purchaseorder/`, trying to create an order |
| Purchase order list | No blank index column; progress reads 0 without products | A bare `'index'` field; NaN |
| Purchase order view | The expected date is the tenant's display string | It printed a JavaScript `Date` |
| Order and reservation views | The products tables render | A string `sort-by` made `BTable` throw whenever there were products |
| Purchase order form | Products taken over from a reservation are new rows | The reservation rows' ids were sent as the order's own |
| Purchase order form | A cleared expected date is refused; the default is computed per mount | It was sent as "Invalid date"; the default was computed once at import |
| Purchase order form | The body carries only what the request declares | It sent the read-only statuses, entries and reservation materials back |
| Material rows | Cancel discards an edit; Edit product enforces Add's rule; errors wait for a pick | The editor was bound to the table row; Edit had no guard; a blank editor opened in error |
| Material rows | Deleting the row being edited resets the editor | The edit index went stale |
| Material rows | Submit saves a row edit left open; an invalid one stops the save and says why | The legacy editor was bound to the row, so Submit saved the edit; the editor now works on a copy (the row above) |
| Material rows | A remark over 255 characters is refused in the panel | It was staged, the with-materials parse threw, and Submit did nothing |
| Reservation list | The delete toast reads "Reservation has been deleted" | It read "Entry Reservation been deleted" |
| Reservation form | Picking another supplier clears the staged products | It kept the previous supplier's products |
| Reservation form | Two panels; the supplier picker reads `supplier/autocomplete/` | One shared products panel; one supplier picker, like the order form's |
| Entry list | New empty-state line | Kit standard |
| Entry view | A real read-only view of the entry | It read a supplier with the entry's id into an unused variable and rendered an empty block |
| Entry form | An invalid edit submit leaves the form usable | It disabled Submit and showed the overlay before validating, then returned |
| Entry form | Picking a product fills the row's name, unit and ordered amount; hand-added rows keep their order | Hand-added rows had blank names and lost `purchase_order` |
| Entry form | A row needs a date as well as a product and an amount of at least 1 | The date was touched but never checked, and went out as "Invalid date" |
| Entry form | The edit shows its order and product read-only, without pickers | The edit's order fields were always blank and its pickers dead |
| Entry form | The edit sends `entry_date` as `YYYY-MM-DD` | It sent the tenant's display string back |
| Entry form | A stock-location read failure toasts | It failed silently |
| Entry form | Create and edit are two screens (they were two routes already) | One shell with the create/edit split running through it |
| Entry form | Picking another order drops the previous order's rows at once; an answer for an order no longer picked is ignored | A failed read left the first order's rows under the second's header, and Submit booked them |
| Entry form, entry list | A save or delete refreshes the order, its products and the stock reads | Each entry books a stock mutation; only the entry and order reads were refreshed, and a delete only the entries |
| Entry form | Submit with a row edit open books the edit; an invalid edit stops the save and says why | The legacy editor was bound to the row; the editor now works on a copy |
| Entry form | A default location chosen before the order applies to the staged rows and the next new row | It was applied only when it changed |
| Entry form | Row errors wait for a product pick, an edit or a commit | They showed on the blank editor after any Submit |
| Entry form | The picker labels are translatable msgids | They were English template literals |
| Read-only views | Material, stock location, supplier, purchase order and reservation views match the legacy markup, apart from the rows above | Proven in each spec before the snapshot was taken |

Owed by the backend (case 1, `docs/schema-strengthenings.md` entry 10): the
required names, the row and entry amounts, and the expected and entry dates.
The API is laxer than every client. The stock mutation and the move have been
paid on the backend (my24service `875b5d8a`).

## Left open

- `purchaseorder-add-from-reservation` passes `reservation_pk`, which the form
  declares and ignores, as the legacy form did.
- Picking a supplier after a reservation keeps `supplier_reservation` on the
  order (legacy behaviour).
- The mutation summary interpolates the location name into HTML without
  escaping; the fix belongs in `StockMutationSimpleSerializer.get_summary`.
- `MaterialCreateSerializer` does not list `location`.
- `formSchema` (`src/models/schema.ts`) types every picked entry `unknown`
  through its `clientOnly` default, so the three simple forms pick with
  `v.pick` instead.

## Tests

`tests/unit/features/inventory-*.spec.js`: material, supplier,
stock-location, mutation, stats, material-rows, purchase-order-{list,detail,form},
reservation and entry-{list,view,form}. Shared picker rows and widget stubs are
in `tests/unit/support/inventory-material-rows.js`. The specs mount the
screens through the feature's door; the material-rows spec reaches its
folder, the one piece two screens share. The legacy specs'
assertions were carried over through the DOM before the legacy specs were
deleted.
