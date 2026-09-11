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
CustomerCard.vue      the customer identity block the detail view and the
                      contract screens mount
customer/             the three screens and their schemas
document/             the documents panel and its schemas
maintenance-contract/ the contract list, form and view, with the staged
                      equipment rows and their dinero helpers
```

Both list screens run on the shared server-paged TanStack Table kit in
`src/features/table/` (promoted out of the Member Slice when the Customer
list became the kit's second consumer). The kit replaced this Slice's own
`paged-list-screen.ts`, `route-paged-list.ts` and `ListPagination.vue`, which
are gone with the b-table screens they served.

The list's column filters ride the wire under the shared bare-name
grammar (no `__icontains` suffixes — the backend's filter kind decides the
lookup, see my24service `apps/core/filters.py`): `name`, `city` and
`remarks` narrow case-insensitively, `num_orders` takes an exact value or an
`18...80` (inclusive) / `18..80` (exclusive) range. Sorting rides the wire as
the engine's `ordering` list — the backend's OrderingMixin (the viewset also
carries the legacy `sort_field`/`sort_dir` mixin; `ordering` wins if a
request ever carried both). With `urlSync` the wire query mirrors into the URL
bar (`useUrlSearchParams('hash')`), so a narrowed view survives a reload and
can be shared as a link — defaults are omitted, a shared address restores the
view before the first request, and the browser's back/forward applies the
address to the state.

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

The customer viewset's schema documents the API-user JWT as an *optional*
`Authorization` header (`schema_utils.AUTH_TOKEN_PARAMETER` — documentation
for the mobile API users that share the viewset). Call sites pass no header:
the generated validator accepts its absence and the axios interceptor adds
the real Bearer token on the wire (a headerless request answers 401, so the
interceptor is load-bearing, not the call site).

### The Excel export's `q` parameter

The list's Excel export (`/api/customer/export/`) reads `q` on the backend
(source/apps/customer/views.py:46-51) though the schema declares no
parameters. It still goes through `my24.downloadItemAuth`, unchanged.

## Declared exceptions — the ledger

Every deliberate behaviour change made while converting, so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere; the specs
assert the routes verbatim. Superseded rows are pruned once the condition
they record no longer holds — former #1 (sort params on the wire), #19
(contract-list sorting) and #33–#35 (the filter grammar and `urlSync`, now
the normative text above) closed with the OrderingMixin work; history in git.

| # | Screen(s) | Exception | Why |
|---|---|---|---|
| 2 | Form, create | Bodies drop the model's own `priceFields` name list | Junk the backend ignored; the parse drops everything the create schema does not declare |
| 3 | Form, create | Bodies carry exactly the create schema's fields | The legacy create sent only what the user typed (its own model was rebuilt empty); the parse makes that a guarantee instead of an accident |
| 4 | Form, edit | Bodies drop the readonly response fields (`id`, `documents`, `branch_view`, the counts, the `*_currency` strings) | Rule 4: the parse output is the body; DRF ignored them, stored outcome identical |
| 5 | Form, edit | Bodies drop the null `time*` fields and send the record's null text fields as absent keys, not nulls | The legacy strip kept them off the wire; an absent PATCH key leaves the stored value unchanged — the same outcome a `null` had |
| 6 | Form | Standard-hour minutes are numbers wearing the legacy labels ('00', '15', '30', '45') | The legacy select held strings DRF coerced; the request schema declares integers |
| 7 | Form | A generated customer id is seeded as the string the input shows | The legacy form carried the check endpoint's number; DRF stringifies both |
| 8 | Form | The partner actions send `customer_id` as a number and parse `PartnerCustomerIdRequest` | Backend declares the real body (`{customer_id: int}`, required); views validate (missing → 400, unknown → 404) |
| 9 | Documents | The add flow works | **Repair, not preservation**: the legacy panel bound its file handler to `@input`, which b-form-file never emits — chosen files joined nothing, nothing could be added. It listens to `change`, as LogoUploadField learned to at #325 |
| 10 | Detail view | The screen renders | **Repair, not preservation**: the Edit-customer link bound `:to="{name, pk}"` without `params`, which vue-router rejects at render — the whole view could not mount, on either route. It carries `params` now, and renders only for a record (the dashboard has none to edit) |
| 11 | Detail view | The five reads fire as parallel queries, not one sequential `loadData` | Same request set; only the ordering guarantee is gone |
| 12 | Detail view | An orders page change refetches the orders, and only the orders | The legacy `loadData` reloaded all five reads because it had no notion of tabs; each read owns its query now |
| 13 | Detail view | The dead search-modal wiring is gone | The legacy template rendered the modal and the handlers, but nothing could open it |
| 14 | Detail view, dashboard | The orders request omits `customer_id` instead of sending the string "null" | The legacy `${null}` of a null prop; the backend scopes a customer user's orders to their own record without it (order/views/mixins/queryset.py:28-35) |
| 15 | Detail view | The identical location/equipment column arrays collapsed into one | The legacy `hasBranches` if/else chose between two byte-identical arrays |
| 16 | Detail view | The Insights statistics fire as four parallel queries when the tab opens | Same request set as the legacy click handler |
| 17 | Contract list | A search term goes in the URL, not just service state | The Slice's URL-state pattern, now the kit's `urlSync`; the legacy term died on reload |
| 18 | Contract list | The dead `#cell(totals)` counters slot is dropped | No `totals` column existed in the legacy fields, so the counters never rendered |
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
| 32 | Contract view | The orders read rides the generated `orderOrderMaintenanceOrdersList` op (`contract`/`page`/`page_size` → `PaginatedOrderList`) | Backend declares the params and the paginated 200; the raw-axios exception is gone |
| 36 | Prototype | The contract cell renders its parts | **Repair, not preservation**: the cell returned a bare array of vnodes, and the table kit's `flexRender` treats a returned object as a component type (`h(...)`) — the array landed there as the component, logged "missing template or render function: []" and rendered nothing. The cell returns one wrapper vnode now |
| 37 | Lists + forms | Headers, panels, delete modals and form runtimes come from the shared kits | Visual no-op: same toolbar markup (download kept), same modal ids, same copy, same wire bodies; staged equipment rows still replay in order through `onSaved` |
| 38 | Contract form | The load-failure toast carries no backend suffix | The legacy toasted `Error loading maintenance contract, <message>`; the shared kit supports a static fetch string only. No spec covers the path |
| 39 | Form, view, documents | Every embedded read asks for the whole collection (`page_size=1000`), not the API's first page | **Repair, not preservation**: a tenant past 20 rows silently lost picker choices and table rows. 1000 is the API's own ceiling — see *The whole-collection bound* below |

### The whole-collection bound

Five reads on these screens are not lists a user pages through — a picker's
options, and the detail tables the form and view embed — so each asks for the
whole collection in one request instead of the API's first page of 20:

| Screen | Read | `page_size` |
|---|---|---|
| Form | `/api/company/partner/` (the branch-partner select) | 1000 |
| Documents panel | `/api/customer/document/` | 1000 |
| Contract form | `/api/customer/maintenance-equipment/` (the staged rows) | 1000 |
| Contract view | `/api/customer/maintenance-equipment/` | 1000 |
| Detail view | `/api/customer/maintenance-contract/`, `/api/equipment/location/`, `/api/equipment/equipment/` | 1000 |

1000 is the API's own ceiling, not a preference: `My24Pagination.max_page_size`
is 1000 (my24service `source/apps/core/rest.py:233-236`) and the DRF paginator
clamps a larger `page_size` **down to it rather than rejecting the request**
(`rest_framework/pagination.py`: `_positive_int(..., cutoff=self.max_page_size)`),
so one response can never carry more. Every viewset behind these reads is a
`BaseMy24ViewSet` — customer `views.py:292,314,332`, company `:1279`,
equipment `:163,320` — and inherits that paginator. The legacy screens asked the
same endpoints for `page_size=1000` where they needed everything
(`views/equipment/location_view/locationViewMixin.js:150`).

The bound is stated rather than paginated because none of these tables has a page
control and a picker cannot page; the orders tab, which does have one, is
unchanged (`CustomerView.vue`, `MaintenanceContractView.vue`).

### The cross-slice import we accept — `OrdersTable`

`CustomerView.vue` and `MaintenanceContractView.vue` mount
`@/components/OrdersTable.vue`, which pulls in `@/models/orders/Status.js` —
the Orders domain's legacy model — when the Slice loads. That one is not
converted here: its consumers span the equipment, location, building, branch,
order and dashboard screens besides these two, so a Slice-local copy would be a
second orders table drifting from the original rather than a narrower one. It
is the future Orders Slice's to rewrite; until then this Slice mounts it
deliberately, and the boundary spec
(`tests/unit/features/customer/customer-slice-boundary.spec.js`) checks the
Slice's model and `CustomerCard` imports only. The Slice's own card is
`./CustomerCard.vue` — the legacy `@/components/CustomerCard.vue` stays
behind with the invoice form, the last screen still mounting it.

## Manual browser checklist

Walk the Customer list against a development tenant after any cross-cutting
change.
