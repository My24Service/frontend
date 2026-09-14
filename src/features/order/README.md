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
  OrderView.vue           the detail, by pk (order-view) or by uuid (order-detail)
  use-order-detail.ts     the two detail reads behind one `order`, and the orderline display rule
  WorkorderModal.vue      the workorder iframe with its PDF download and regenerate action
  PurchaseInvoicesPanel.vue  a branch tenant's purchase invoices on the order: list, add, delete
workorder/
  WorkorderPage.vue       the printable workorder on the public route, one read rendered as-is
form/
  OrderForm.vue           the create/edit form; the user's role picks the variant
  schemas.ts              the four create bodies and two update bodies, the form values,
                          validation and parse; the orderline and infoline row schemas
  use-staged-rows.ts      rows staged in a form and replayed on save (orderlines, infolines)
  use-order-pickers.ts    the customer/branch, equipment/location, engineer and sales-user pickers
  OrderDocumentsPanel.vue the order's documents, staged and replayed with the save
schedule/
  OrdersSchedule.vue      the theme dispatch: shltr or default
  use-schedule.ts         the calendar, its event source, the type tints and the legend filter
  ScheduleShltr.vue, ScheduleDefault.vue, ScheduleOrderModal.vue
```

## The form

One screen where there were four. The backend has one create serializer per
role — `OrderCreateBranch` / `OrderCreateCustomerRelation` for planning
(by tenant shape), `OrderCreateCustomer`, `OrderCreateBranchEmployee` —
and the generated request union names all four; `schemas.ts` picks one by
the session's role and the form shows the sections that role has. The
save is the legacy sequence on generated ops: the order, then the
orderlines, infolines and documents against its id, then the engineer
assignments, then the acceptance for "Save & accept". Every step past the
order write reports as a failed save and keeps the user on the form.

The kit gained `afterSave` for "Submit and open dispatch", which goes
forward to the dispatch screen instead of back.

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
| View | The Edit link carries `params: {pk}` | The legacy link put `pk` beside `params`; vue-router resolved it without one. Same family as the Customer Slice's entry |
| View, by uuid | No Edit link, no purchase invoices, no regenerate button | The public detail serializer carries no numeric id, and the legacy screen addressed all three with a `pk` that was null on that route |
| View | The workorder iframe gets its `src` on first open | The legacy bound it at mount too, to an empty string; binding the real address at mount would load the workorder page behind every closed modal |
| View | The documents block is a read-only list of the detail's `documents` | The legacy mounted the form's documents panel in view mode, which *deleted* any document with a null file as a side effect of opening the page |
| View | The purchase invoices are their own query and refetch alone after an add or delete | The legacy re-read the whole order after each |
| View | An orderline's equipment-name override is computed, not written back | Same rendering; the detail data is no longer mutated in place |
| View | The partner workorder line drops its `via` | The serializer declares no such field; nothing ever rendered there |
| View | The `past` prop still hides the regenerate button | Kept as declared; no route passes it |
| Workorder | The "Partner order ID(s)" block is gone, and the original order is read from `order.parent_order_data` | The legacy read both off the response's top level, where the schema declares neither; `parent_order_data` is declared on the order. If the backend does send `copied_order_data` there, the schema is the place to say so |
| Workorder | A failed read toasts | The legacy `created()` had no catch; the page stayed blank |
| Form | The update is a `PUT` with the full body, not a `PATCH` | The schema declares the PATCH body as the plain `Order` serializer, which has no `planning_remarks`; the PUT body is `OrderUpdate`, which does. The stored outcome is the same |
| Form | Blank optional strings and unpicked ids are absent from the body, not `''`/`null` | The parse output is the body |
| Form | `service_number` is gone | No serializer ever accepted it; what was typed there was discarded on submit |
| Form | The engineer picker is the whole select list, narrowed client-side | The legacy searched `/company/user-list/?q=&user_type=` per keystroke — a query the schema does not declare |
| Form | Assigning sends no `notify_user=1` | The assign op declares no such query parameter. **Backend gap**: if the notification hangs on it, declare it and this is one line |
| Form | Sales users come from `/company/salesuser/?q=` | Same undeclared user-list query as above |
| Form | Documents replay on edit too, with the save | The legacy replayed them on create only and left an edit's panel to its own Save button |
| Form | A time is sent as `HH:mm:00` | The serializer declares `HH:mm:ss`; the inputs take `HH:mm` |
| Form | A refused unassign names the engineer in the toast and aborts the save | The legacy toasted and still navigated away |
| Form | The quotation route is a sibling of the maintenance route | As a child it rendered the parent's props: the form has no nested router-view |
| Form | The customer form no longer requires the address | The customer serializer does not, and the customer's own record fills it |
| Schedule | The range is sent as `YYYY-MM-DD` | The legacy built `2026-9-1`; the op declares dates |
| Schedule | Events and the clicked order go through the query cache | Same requests; a range revisited within the cache window is not refetched |
| Schedule | The `start`/`end` route params are not taken | Neither design ever read them |

## Manual browser checklist

Walk the orders list against a development tenant after any cross-cutting
change: the All / Not accepted pills, a saved-filter pill (address bar shows
`user_filter=`), a status change from the row select, a delete, and on
`/mobile/orders` the Assign icon and the selection strip. On the detail:
the workorder modal (iframe, PDF download, regenerate), and on a branch
tenant the purchase-invoice add and delete.
