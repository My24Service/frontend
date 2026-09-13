# The Order Slice

The order screens: the list (five variants of it — the plain list, the
customer's not-accepted orders, and the three mobile dispatch lists), the
detail view, the create/edit form in its planning, customer and
branch-employee variants, the public workorder page, the schedule and the
year/month statistics. This directory follows the Member Slice
(`src/features/member/`, the reference implementation): the same rules, the
same testing bar. Read this file for what the Order Slice adds on top.

`docs/order-slice-characterisation.md` is what the legacy screens did, pinned
before anything moved; this file is what replaced them.

## Layout

```
index.ts                  the one door; the router mounts what is exported here
use-member-new-data.ts    subscribe to one member websocket event while mounted
order/
  OrderList.vue           the list, on the shared server-paged table kit
  list-modes.ts           queryMode → generated list op; what only the plain list takes
  OrderStatusCell.vue     the status column: a coloured select that posts a new status
  status-color.ts         which statuscode a status names, and its colour
  use-unaccepted-count.ts the not-accepted count, written to the store for the subnav badge
```

## The list

One screen, five backend actions. The router names the mode (`queryMode`:
`all`, `unaccepted`, `dispatch`, `inprogress`, `finished`) and
`list-modes.ts` picks the generated op; the old `OrderService.getListUrl()`
switch is that file's `switch`, now typed. The three mobile routes also pass
`dispatch: true`, which turns on the row's Assign icon and the selection strip
that hands picked orders to the dispatch screen through `store.assignOrders`.

The column filters ride the wire under the shared bare-name grammar
(`order_id`, `order_name`, `order_type`, `last_status`); the type and status
filters are selects over the tenant's order types and statuscodes, which is
what the table kit's restored `filterVariant: 'select'` is for. Sorting rides
as the engine's `ordering` list — on the plain list only: the dispatch and
not-accepted actions do not declare `ordering` yet, so those headers offer no
sort rather than one the wire would drop. With `urlSync` the view survives a
reload and can be shared as a link.

### The saved filters

The legacy list narrowed itself with *saved filters* (`/order/filter/`, the
`UserFilterList`/`UserFilterForm` screens in `src/views/shared/`, the
`?user_filter=<id>` param). Those screens are not this Slice's and stay
mounted as they are; the list keeps their pills. Picking one sets a
`user_filter` column filter on the kit — a filter without a column, which the
kit commits, mirrors into the address and hands to `listOptions` like any
other — and the screen forwards it on the wire. Only the plain list's action
declares `user_filter`; the other modes drop it.

## What must survive as a shim

`src/models/orders/Order.ts` (`OrderService`, `OrderModel`, the schemas) has
23 importers outside the slice — dashboard, equipment, invoices, quotations,
mobile, the engineer-event form, `utils.js`. It stays until those slices
move, the same way `models/customer/Customer.js` did.

`src/components/OrdersTable.vue` — the embedded orders block the customer,
equipment, location, building, branch and dashboard views mount — is also
not rewritten here: its consumers are legacy screens plus the two Customer
Slice views, and a TanStack copy beside it would be a second table drifting
from the first. The list's own columns are the same six the block shows.

## Declared exceptions — the ledger

Behaviour the Slice deliberately changed, collected so a reviewer can tell
an intended fix from a refactor bug. URLs moved nowhere; the specs assert
the routes verbatim.

| Screen(s) | Exception | Why |
|---|---|---|
| List | Sorting is per column through `ordering`; the sort modal (`order_by` ∈ default/last_update) and its "orders since" date are gone | The bare-name grammar; `order_by` is documented as superseded by `ordering`. A `start_date` range filter waits on the backend declaring one |
| List | The wire never carries `order_by=default` | The legacy screen copied its radio's default onto every request |
| List | Search, filters, sort and page live in the URL | The kit's `urlSync`; the legacy list kept search and sort in component state and lost them on reload |
| List | The saved filters and the unaccepted count are read once per mount and refetched with the page, not re-read on every search, sort and delete | Each is its own query now |
| List, dispatch modes | Headers do not sort | Their actions declare no `ordering`; a sort the wire dropped would look broken |
| List, not-accepted | `user_filter` is dropped from the request | The action does not declare it; the legacy list sent it and the backend ignored it |
| List | The change-status modal is gone | Nothing opened it; the status column's select is the live path |
| List | The status select posts through the generated `orderStatusCreate` op, order-only | `TableStatusInfo` served three domains through their model services; the invoice and quotation lists keep it |
| List | A statuscode matches a status by case-insensitive substring | The legacy helper built a `RegExp` from the code; same result unless a code held a metacharacter |
| List | Delete confirms through the kit's modal, refetches through the list query key | Same modal id and copy |
| List | The temps variant is retired | See `docs/order-slice-characterisation.md` |

## Manual browser checklist

Walk the orders list against a development tenant after any cross-cutting
change: the All / Not accepted pills, a saved-filter pill (address bar shows
`user_filter=`), a status change from the row select, a delete, and on
`/mobile/orders` the Assign icon and the selection strip.
