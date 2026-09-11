# The Customer Slice

Six screens in two groups — the customer list, the customer form (create/
edit, with its documents panel and branch-partner section) and the customer
detail view, which doubles as the customer-type user's dashboard; plus the
maintenance-contract list, its create/edit form (whose equipment rows are
staged client-side and replayed on save) and its detail view, whose orders
tab hands equipment lines to the maintenance order form. This directory follows the Member Slice
(`src/features/member/`, the reference implementation): the same rules, the
same testing bar. Read
this file for what the Customer Slice adds on top.

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
`src/features/table/`.

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

`src/models/customer/Customer.js` is the Shim beside its
callers (quotation, order, invoice, equipment and company screens); it
keeps `CustomerModel`, `CustomerPriceModel`, the autocomplete `search` and
`getMyCustomer`.

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

The list's Excel export (`/api/customer/export/`) takes the toolbar search as
`q` and downloads through `my24.downloadItemAuth`.

## Declared exceptions — the ledger

Behaviour the Slice deliberately changed, collected so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere; the specs
assert the routes verbatim.

| Screen(s) | Exception | Why |
|---|---|---|
| Form, create | Bodies drop the model's own `priceFields` name list | The parse drops everything the create schema does not declare |
| Form, create | Bodies carry exactly the create schema's fields | The parse output is the body |
| Form, edit | Bodies drop the readonly response fields (`id`, `documents`, `branch_view`, the counts, the `*_currency` strings) | The parse output is the body; DRF ignored them, stored outcome identical |
| Form, edit | Bodies drop the null `time*` fields and send the record's null text fields as absent keys, not nulls | An absent PATCH key leaves the stored value unchanged — the same outcome a `null` had |
| Form | Standard-hour minutes are numbers wearing the labels ('00', '15', '30', '45') | The request schema declares integers |
| Form | A generated customer id is seeded as the string the input shows | DRF stringifies both |
| Form | The partner actions send `customer_id` as a number and parse `PartnerCustomerIdRequest` | The backend declares the body (`{customer_id: int}`, required); views validate (missing → 400, unknown → 404) |
| Documents | The add flow listens to `change` | `b-form-file` never emits `@input` — chosen files joined nothing |
| Detail view | The Edit-customer link carries `params` | Without them vue-router rejects the link at render and the view cannot mount; the view renders only for a record |
| Detail view | The five reads fire as parallel queries, not one sequence | Same request set; only the ordering guarantee is gone |
| Detail view | An orders page change refetches the orders, and only the orders | Each read owns its query now |
| Detail view | The dead search-modal wiring is gone | Nothing could open it |
| Detail view, dashboard | The orders request omits `customer_id` for a customer user | The backend scopes a customer user's orders to their own record without it |
| Detail view | The identical location/equipment column arrays collapsed into one | Two byte-identical branches |
| Detail view | The Insights statistics fire as four parallel queries when the tab opens | Same request set |
| Contract list | A search term goes in the URL, not just component state | The kit's `urlSync` |
| Contract list | The dead `#cell(totals)` counters slot is dropped | No `totals` column exists, so the counters never rendered |
| Contract form | Bodies carry exactly the write schemas' fields (contract and equipment rows) | The parse drops the readonly response fields, the counts, the dinero objects, `priceFields` |
| Contract form | Equipment rows send `contract` as the number the schema declares | DRF coerced the string form too |
| Contract form | Equipment rows send `times_per_year` as the number the schema declares | An untouched frequency stays absent |
| Contract form | Quick-created equipment reaches the staged row | The old flow POSTed and then threw on a misnamed property, so the created equipment never reached the form |
| Contract form | The contract-value input shows the running total | The old input bound `:value`, which the current `BFormInput` no longer consumes |
| Contract form | The contract, customer and equipment reads fire as parallel queries | Same request set; the customer detail cannot start before the contract names the customer |
| Contract form | The save invalidates the contract- and equipment-list queries | The mounted equipment query refetches as part of the save now |
| Contract view | The contract, equipment and orders reads fire as parallel queries | Same request set |
| Contract view | An orders page change (and the tab's Refresh) refetch the orders only | Each read owns its query now |
| Contract view | A failed load tells the user | The old catch never imported `errorToast`, so the screen stayed dark |
| Contract view | The dead `#cell(tariff_total)` slot is dropped | No `tariff_total` column exists, so the slot never rendered |
| Contract view | The orders-tab search modal is gone | OK-ing it threw; same family as the customer detail's dead wiring |
| Contract view | The orders read rides the generated `orderOrderMaintenanceOrdersList` op (`contract`/`page`/`page_size` → `PaginatedOrderList`) | The backend declares the params and the paginated 200 |
| Lists + forms | Headers, panels, delete modals and form runtimes come from the shared kits | Same toolbar markup (download kept), same modal ids, same copy, same wire bodies; staged equipment rows still replay in order through `onSaved` |
| Contract form | The load-failure toast carries no backend suffix | The shared kit supports a static fetch string only. No spec covers the path |
| Form, view, documents | Every embedded read asks for the whole collection (`page_size=1000`), not the API's first page | A tenant past 20 rows lost picker choices and table rows. 1000 is the API's own ceiling — see *The whole-collection bound* below |

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
so one response can never carry more. Every viewset behind these reads
inherits that paginator.

The bound is stated rather than paginated because none of these tables has a page
control and a picker cannot page; the orders tab, which does have one, is
unchanged (`CustomerView.vue`, `MaintenanceContractView.vue`).

### The cross-slice import we accept — `OrdersTable`

`CustomerView.vue` and `MaintenanceContractView.vue` mount
`@/components/OrdersTable.vue`, which pulls in `@/models/orders/Status.js` —
the Orders domain's model — when the Slice loads. Its consumers span the equipment, location, building, branch,
order and dashboard screens besides these two, so a Slice-local copy would be a
second orders table drifting from the original rather than a narrower one. It
is the future Orders Slice's to rewrite; until then this Slice mounts it
deliberately, and the boundary spec
(`tests/unit/features/customer/customer-slice-boundary.spec.js`) checks the
Slice's model and `CustomerCard` imports only. The Slice's own card is
`./CustomerCard.vue`.

## Manual browser checklist

Walk the Customer list against a development tenant after any cross-cutting
change.
