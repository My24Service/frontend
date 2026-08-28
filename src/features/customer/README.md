# The Customer Slice

Six screens in two groups — the customer list, the customer form (create/
edit, with its documents panel and branch-partner section) and the customer
detail view, which doubles as the customer-type user's dashboard; plus the
maintenance-contract list, its create/edit form (whose equipment rows are
staged client-side and replayed on save) and its detail view, whose orders
tab hands equipment lines to the maintenance order form — rewritten end to
end as the second Slice of the rewrite. This directory follows the Member Slice
(`src/features/member/`, the reference implementation): the same rules, the
same testing bar, the same shape of ADRs. They are not restated here; read
this file for what the Customer Slice adds on top and where it had to
differ from the legacy behaviour.

## Layout

```
index.ts              the one door; the router mounts what is exported here
route-paged-list.ts   page, search, and (new against Member) sort state in the URL
paged-list-screen.ts  the list skeleton: search, delete, sort, refresh, load-error
ListPagination.vue    the count-and-pagination block (copied from Member)
customer/             the three screens, their schemas and their invalidation
document/             the documents panel, its schemas and its invalidation
maintenance-contract/ the contract list, form and view, with the staged
                      equipment rows and their invalidation helpers
session-auth-header.ts  the Authorization story every write/retrieve needs
```

`src/models/customer/Document.js`, `MaintenanceContract.js` and
`MaintenanceEquipment.js` are deleted — the contract screens were their only
consumers, and the panel and the contract screens read the generated queries
directly. `src/models/customer/Customer.js` is now the Shim beside its
legacy callers (quotation, order, invoice, equipment and company screens); it
keeps `CustomerModel`, `CustomerPriceModel`, the autocomplete `search` and
`getMyCustomer`, and dies when those screens get their own Slices.

The equipment/location/building screens the customer router also mounts are
NOT in this Slice: they are shared components (`src/views/equipment/`, their
own `SubNavEquipment` and models), mounted identically by `router/equipment.js`
and `router/settings.js` — they are the Equipment Slice's to move. The
`MaintenanceEquipment` resource (a contract's tariffed equipment rows) is
customer-domain — `/api/customer/maintenance-equipment/` — and is the
contract form's staged collection here.

## What this Slice adds to the reference pattern

### The Authorization header

The customer viewset's schema documents the API-user JWT as a REQUIRED
`Authorization` header on its create/retrieve/update/destroy operations
(`schema_utils.AUTH_TOKEN_PARAMETER` — documentation for the mobile API users
that share the viewset). The generated client's request validator refuses to
send anything without it. The web app authenticates by session cookie, so
every call site of those operations passes `SESSION_AUTH_HEADER`
(`./session-auth-header.ts`): an empty value satisfies the validator, and on
the wire simplejwt skips an empty header, so session authentication proceeds
untouched.

### Sorting lives in the URL, not (yet) on the wire

The legacy list sorts server-side: `SortingMixin` honours
`sort_field`/`sort_dir` (source/apps/core/views.py:677), the columns carry
`sortable: true`, and the sort state lives in the URL. The OpenAPI schema does
not declare the two parameters, so the generated client cannot type them, and
the wire request cannot carry them. The URL keeps carrying them — the state
the legacy screen kept — so the request is correct the moment the backend
documents the two parameters (the member-list ordering change is the
precedent). Until then, clicking a column header updates the URL and the sort
arrows; the rows come back in the backend's default order.

The list's Excel export (`/api/customer/export/`) reads `q` on the backend
(source/apps/customer/views.py:46-51) though the schema declares no
parameters. It still goes through `my24.downloadItemAuth`, unchanged.

### The documents panel stages like the legacy, minus the machinery

The legacy panel staged creates/updates/deletes on a BaseModel collection and
replayed them on "Save changes" — creates and updates in row order, then the
deletes, stopping at the first failure. The converted panel stages the same
way with plain local state: edits mutate the rows in place (including on
cancel, as the legacy edit form did), deletes only mark, and "Save changes"
replays through the generated mutations in the legacy order. While staged
changes exist, refetches are ignored — the same rows a reload would have
clobbered — and "Discard changes" drops the staging and refetches.

A stored file's URL is structurally barred from the wire (the row keeps it as
`storedFile`, never `file`) — the legacy screen deleted any `file` starting
with `http` before saving, so a stored document is never re-uploaded. A newly
chosen file rides out as a base64 `data:` URL, which the request schema's
`url()` rule accepts.

## Declared exceptions — the ledger

Every deliberate behaviour change made while converting, so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere; the specs
assert the routes verbatim.

| # | Screen(s) | Exception | Why |
|---|---|---|---|
| 1 | List | Sort clicks keep the URL state but send no `sort_field`/`sort_dir` | Schema gap: `SortingMixin` honours them (core/views.py:677) but the OpenAPI schema does not declare them; the generated client cannot type them. URL state preserved for the backend fix |
| 2 | Form, create | Bodies drop the model's own `priceFields` name list | Junk the backend ignored; the parse drops everything the create schema does not declare |
| 3 | Form, create | Bodies carry exactly the create schema's fields | The legacy create sent only what the user typed (its own model was rebuilt empty); the parse makes that a guarantee instead of an accident |
| 4 | Form, edit | Bodies drop the readonly response fields (`id`, `documents`, `branch_view`, the counts, the `*_currency` strings) | Rule 4: the parse output is the body; DRF ignored them, stored outcome identical |
| 5 | Form, edit | Bodies drop the null `time*` fields and send the record's null text fields as absent keys, not nulls | The legacy strip kept them off the wire; an absent PATCH key leaves the stored value unchanged — the same outcome a `null` had |
| 6 | Form | Standard-hour minutes are numbers wearing the legacy labels ('00', '15', '30', '45') | The legacy select held strings DRF coerced; the request schema declares integers |
| 7 | Form | A generated customer id is seeded as the string the input shows | The legacy form carried the check endpoint's number; DRF stringifies both |
| 8 | Form | The partner actions send `customer_id` as a number (the legacy sent the route prop's string) | Backend coerces both (company/views.py:1293-1296, 1307-1309). The OpenAPI body is misdeclared as a Partner; the generated write schema happens to tolerate the real body, so it goes out unparsed |
| 9 | Documents | The add flow works | **Repair, not preservation**: the legacy panel bound its file handler to `@input`, which b-form-file never emits — chosen files joined nothing, nothing could be added. It listens to `change`, as LogoUploadField learned to at #325 |
| 10 | Detail view | The screen renders | **Repair, not preservation**: the Edit-customer link bound `:to="{name, pk}"` without `params`, which vue-router rejects at render — the whole view could not mount, on either route. It carries `params` now, and renders only for a record (the dashboard has none to edit) |
| 11 | Detail view | The five reads fire as parallel queries, not one sequential `loadData` | Same request set; only the ordering guarantee is gone |
| 12 | Detail view | An orders page change refetches the orders, and only the orders | The legacy `loadData` reloaded all five reads because it had no notion of tabs; each read owns its query now |
| 13 | Detail view | The dead search-modal wiring is gone | The legacy template rendered the modal and the handlers, but nothing could open it |
| 14 | Detail view, dashboard | The orders request omits `customer_id` instead of sending the string "null" | The legacy `${null}` of a null prop; the backend scopes a customer user's orders to their own record without it (order/views/mixins/queryset.py:28-35) |
| 15 | Detail view | The identical location/equipment column arrays collapsed into one | The legacy `hasBranches` if/else chose between two byte-identical arrays |
| 16 | Detail view | The Insights statistics fire as four parallel queries when the tab opens | Same request set as the legacy click handler |
| 17 | Contract list | A search term goes in the URL, not just service state | The Slice's route-paged-list pattern; the legacy term died on reload |
| 18 | Contract list | The dead `#cell(totals)` counters slot is dropped | No `totals` column existed in the legacy fields, so the counters never rendered |
| 19 | Contract list | No sort is wired | The legacy table showed sort icons but had no handler and never carried sort on the wire — clicks sorted the current page locally. Nothing to preserve; the URL-sort repair (#1) has no contract-list analogue |
| 20 | Contract form | Bodies carry exactly the write schemas' fields (contract and equipment rows) | The legacy PATCH round-tripped the whole model — the readonly response fields, the counts, the dinero objects, `priceFields` — and DRF ignored all of it; the parse drops it (same family as #2–#6) |
| 21 | Contract form | Equipment rows send `contract` as the number the schema declares | The legacy create sent the created response's numeric id, the edit sent the route prop's string ("5") — DRF coerced both |
| 22 | Contract form | Equipment rows send `times_per_year` as the number the schema declares | The legacy wire carried the text input's digit string ("4"); DRF's IntegerField coerced both. An untouched frequency stays absent, as the legacy model's undefined keys did |
| 23 | Contract form | Quick-created equipment reaches the staged row | **Repair, not preservation**: the legacy flow POSTed successfully and then threw — `this.maintenanceEquipment.equipment = response.id` named no property (the service is `maintenanceEquipmentService`) — so the created equipment never reached the form; the user saw only an error toast |
| 24 | Contract form | The contract-value input shows the running total | **Repair, not preservation**: the legacy input bound `:value`, which bootstrap-vue-next's BFormInput no longer consumes — the field rendered empty |
| 25 | Contract form | The contract, customer and equipment reads fire as parallel queries | Same request set as the legacy sequence; the customer detail cannot start before the contract names the customer |
| 26 | Contract form | The save invalidates the contract- and equipment-list queries | The legacy screen navigated back and trusted the next mount's reload; the mounted equipment query refetches as part of the save now |
| 27 | Contract view | The contract, equipment and orders reads fire as parallel queries | Same request set as the legacy `loadData` sequence |
| 28 | Contract view | An orders page change (and the tab's Refresh) refetch the orders only | The legacy `loadData` reloaded all three reads; each read owns its query now |
| 29 | Contract view | A failed load tells the user | **Repair, not preservation**: the legacy catch called `errorToast` without importing it — a ReferenceError the user never saw; the screen just stayed dark |
| 30 | Contract view | The dead `#cell(tariff_total)` slot is dropped | No `tariff_total` column existed in the legacy equipment fields, so the slot never rendered |
| 31 | Contract view | The orders-tab search modal is gone | The legacy `handleSearchOk` called `this.orderService.setSearchQuery`, and the view had no `orderService` — OK-ing the modal threw. Same family as the customer detail's dead wiring (#13) |
| 32 | Contract view | The orders read rides the shared axios instance directly | Schema gap: the backend reads `contract`/`page` (order/views/order.py:651-659) and answers the paginated envelope (core/rest.py:479-491), but the OpenAPI schema declares no query parameters and a single Order as the response — the generated client's own validator would reject the needed request before it left |

## Still outstanding

- **Recordings.** The golden hooks in the specs skip loudly until a HAR is
  captured from a real tenant (see `tests/unit/golden/README.md`):
  `customer-list` — initial load, page 2 and search term, delete;
  `customer-form` — create load and submit, edit load and save;
  `maintenance-contract-list` — initial load, page 2 and search term;
  `maintenance-contract-form` — create load and submit, edit load and save;
  `maintenance-contract-view` — initial load. Run
  `npm run golden -- --todo` for the live list.
- **The sort parameters** need the backend to document
  `sort_field`/`sort_dir` on `customer_customer_list` (the member-list
  ordering change is the model), then `npm run codegen` and folding the two
  into the list's query key and wire query.
- **The `maintenance_orders` schema** needs the backend to declare its
  `contract`/`page` query parameters and its paginated-envelope response
  (ledger #32); then `npm run codegen`, move the read to the generated
  options, and drop the tolerated violations.
- **Mutation testing** has not been run over this folder yet; the Member
  Slice's score is the benchmark to meet.

## Manual browser checklist

The network seam cannot see a control in the wrong place or a broken layout.
Walk these against a development tenant with a staff login (a customer-type
login where noted) after any cross-cutting change. Checked means done on
______ (date) by ______.

**Customer list** — `/customers/customers`
- [ ] Rows render name/contact/orders/remarks; branch rows show the branch
      address block and the pink `branch` background
- [ ] Sorting arrows toggle and the URL carries `?sort_field=&sort_dir=`
      (rows reorder only once the backend documents the parameters — see the
      ledger)
- [ ] Search modal opens, searches, and the URL carries `?q=`; pagination
      works with more than 20 rows
- [ ] Delete asks, deletes, toasts success, and reloads the page you were on
- [ ] Download asks, and the Excel file honours the search term
- [ ] Add customer links to the form

**Customer form** — `/customers/customers/form` and `/customers/customers/form/:pk`
- [ ] Create: empty submit shows the six field messages; a tenant with
      auto-generated ids shows a readonly prefilled id, others can type one;
      "generate new" fills the latest id
- [ ] Edit: the record fills every field; prices show the stored currency;
      saving returns to the list already showing the change
- [ ] Documents panel (edit only): empty collection auto-opens the add form;
      choosing files stages rows; edit/delete stage; Save changes POSTs,
      PATCHes and DELETEs in that order; a stored file is never re-uploaded;
      Discard rolls everything back
- [ ] Branch section: the dropdown lists only partners with branches;
      choosing one fetches its branches; Synchronize orders copies and
      refetches; Create-from-customer asks, creates and selects the branch;
      the address fields disable while "use branch address" applies

**Customer detail / dashboard** — `/customers/customers/:pk` and `/customers/dashboard`
- [ ] Staff: the title shows the record, Edit customer links to the form, and
      the five tabs render orders, equipment, contracts, locations and the
      Insights statistics (stats fire on first open)
- [ ] Orders paginate at twenty
- [ ] Customer-type user at `/customers/dashboard`: an empty shell renders
      without errors, no record fetch, no crash (see the ledger)

**Maintenance contracts list** — `/customers/maintenance-contracts`
- [ ] Rows render name (link to the view), customer, the formatted contract
      value, remarks and created; edit and delete icons per row
- [ ] Search modal opens, searches, and the URL carries `?q=`; pagination
      moves through the URL
- [ ] Delete asks, deletes, toasts success, and reloads the page you were on
- [ ] Add contract links to the form

**Maintenance contract form** — `/customers/maintenance-contracts/form[/:pk]`
- [ ] Create: empty submit shows the name and customer messages; the customer
      autocomplete searches (debounced), selecting one shows the card and
      opens the equipment panel
- [ ] Equipment rows: the autocomplete filters to the customer; a staged row
      shows in the table; edit and delete work; the running contract value
      shows (a repaired display, see the ledger); quick-create from the
      no-result panel lands in the staged row (repaired, see the ledger)
- [ ] Save: the contract posts, the staged rows replay after it, the toasts
      fire, and the form navigates back; edit loads the contract, the
      customer and the equipment

**Maintenance contract view** — `/customers/maintenance-contracts/view/:pk`
- [ ] The contract value and remarks render; the customer card links to the
      customer detail
- [ ] Equipment tab: rows render frequency and tariff; Select equipment
      stages order lines; checking one enables Add equipment, which stores
      the selection and routes to the maintenance order form
- [ ] Orders tab: the contract's orders render, paginate at twenty, and a
      page change refetches only the orders
