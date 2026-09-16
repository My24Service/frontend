# The Order Slice

The order screens: the list (five variants of it — the plain list, the
customer's not-accepted orders, and the three mobile dispatch lists), the
detail view, the create/edit form in its planning, customer and
branch-employee variants, the temps tenant's own form and detail, the
public workorder page, the schedule and the year/month statistics. This directory follows the Member Slice
(`src/features/member/`, the reference implementation): the same rules, the
same testing bar. Read this file for what the Order Slice adds on top.

`docs/order-slice-characterisation.md` is what the legacy screens did, pinned
before anything moved; this file is what replaced them.

## Layout

```
index.ts                  the one door; the router mounts what is exported here
OrderFormByTenant.vue     the form the router mounts: the temps tenant's, or form/OrderForm
OrderViewByTenant.vue     the detail the router mounts: the temps tenant's, or order/OrderView
use-member-new-data.ts    subscribe to one member websocket event while mounted
order/
  OrderList.vue           the list, on the shared server-paged table kit
  list-modes.ts           queryMode → generated list op; the kit's query as the op's
  use-order-columns.ts    the columns, with the statuses read the status filter offers
  use-saved-filter-pills.ts  the legacy saved filters as pills over a `user_filter` column filter
  use-dispatch-selection.ts  the rows picked on the mobile lists, handed to the dispatch screen
  OrderStatusCell.vue     the status column: a coloured select that posts a new status
  status-color.ts         which statuscode a status names, and its colour
  use-unaccepted-count.ts the not-accepted count, written to the store for the subnav badge
  OrderView.vue           the detail, by pk (order-view) or by uuid (order-detail); the header
  OrderSummaryPanel.vue     …the order, its assignees, workorder, related orders and contact
  OrderInvoicesPanel.vue    …its invoices, workorder documents and reported extra text
  OrderContentsPanel.vue    …its documents, orderlines, infolines and status timeline
  WorkorderDocumentList.vue one "Workorder documents" block
  use-order-detail.ts     the two detail reads behind one `order`, and the orderline display rule
  use-order-viewer.ts     who is looking and what their tenant has: the panels' show/hide flags
  WorkorderModal.vue      the workorder iframe with its PDF download and regenerate action
  PurchaseInvoicesPanel.vue  a branch tenant's purchase invoices on the order: list, add, delete
workorder/
  WorkorderPage.vue       the printable workorder on the public route, one read rendered as-is
form/
  OrderForm.vue           the create/edit form: the order's own fields and the save sequence;
                          the user's role picks the variant
  schemas.ts              the four create bodies and two update bodies, the form values,
                          validation and parse; the orderline and infoline row schemas
  ContactPanel.vue        the owner picker and the contact block it fills
  DateTimeFields.vue      one planning moment: a date beside a typed/picked time (start, end)
  EngineersPanel.vue      assign to / assignees, staged and replayed with the save
  use-engineer-assignment.ts  …its staging and replay; `UnassignRefused`
  ExtraRecipientsField.vue    the extra e-mail addresses, bound to the order's list
  OrderlinesPanel.vue     the orderlines, with the equipment/location pickers in equipment mode
  QuickCreateModal.vue    …the one-field modal that creates an equipment or location by name
  InfolinesPanel.vue      the infolines
  OrderDocumentsPanel.vue the order's documents
  use-staged-rows.ts      rows staged in a form and replayed on save (the panels above)
  use-order-pickers.ts    the customer/branch, equipment/location, engineer and sales-user
                          searches, and the pure `fillCustomer` / `fillBranch`
  use-order-seeds.ts      what a create starts with: own branch, own customer, a quotation,
                          a maintenance contract's equipment
temps/
  use-temps-tenant.ts     the one flag: `member_type === 'temps'`
  TempsForm.vue           the temps order form: the planning contact block, type, headcount,
                          reference, planning moments and typed orderlines; no engineers,
                          infolines or documents
  TempsView.vue           the temps detail: the order, its headcount, contact, lines and timeline
  schemas.ts              the planning form values and body plus `required_users`
  assignees-cell.ts       the list's people column on a temps tenant: a headcount, not names
schedule/
  OrdersSchedule.vue      the theme dispatch: shltr or default
  use-schedule.ts         the calendar, its event source, the type tints and the legend filter
  OrdersSchedule.vue, ScheduleOrderModal.vue
stats/
  YearStats.vue, MonthStats.vue   the two statistics pages
  StatsPage.vue           the frame they share: period switch, stepper, order-type select
  ChartPairRow.vue        a bar of counts beside a pie of percentages
  chart-data.ts           the pure layout of a year/month response into chart pairs
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

### The temps tenant

A temps agency (`member_type: 'temps'`, the generated `MemberTypeEnum`)
staffs its orders from the dispatch screen, so its form has no engineers,
infolines or documents and one field the maintenance form lacks: how many
people the order needs, `required_users`. That is not a fifth `FormRole` —
the role machinery is about *who* fills the form, and the temps form is
always the planning user's — but its own screen in `temps/`, composed from
the same panels and `useResourceForm`, with `temps/schemas.ts` wrapping
the planning schemas to add the one field. `OrderFormByTenant.vue` and
`OrderViewByTenant.vue` pick it by the store's member type; the list is one
screen for both, and only its people column knows (`temps/assignees-cell.ts`).

`required_users` is on the model and on every read serializer, and on no
create or update serializer — it never was, so the legacy form's
"Required users" was discarded on every submit. The rebuilt form sends it
so that the day `BaseOrderCreatePlanningSerializer` and
`OrderUpdateSerializer` list it, nothing here changes; until then the
backend ignores it. The seam does not catch this (a generated object
schema strips unknown keys rather than rejecting them), which is why it is
written down here.

The order's children — documents, orderlines, infolines, engineers — are
each a panel component on one pattern: it takes the record's rows as a
prop (a change is a load, and replaces what was staged), stages edits
locally, and exposes `replay(orderId)` for the form's `onSaved` to call in
sequence. The form passes those rows through computeds so a create's empty
set is one stable array rather than a fresh one per render. The panels
own their own mutations; the form only orders the calls.

## The list

One screen, five backend actions. The router names the mode (`queryMode`:
`all`, `unaccepted`, `dispatch`, `inprogress`, `finished`) and
`list-modes.ts` picks the generated op; the old `OrderService.getListUrl()`
switch is that file's `switch`, now typed. The three mobile routes also pass
`dispatch: true`, which turns on the row's Assign icon and the selection strip
that hands picked orders to the dispatch screen through `store.assignOrders`.

The column filters ride the wire under the shared bare-name grammar
(`order_id`, `order_name`, `order_type`, `last_status`, `start_date` — a day,
month or year, or a `...`/`..` range of them);
the type and status filters are selects over the tenant's order types and
statuscodes, which is what the table kit's restored `filterVariant: 'select'`
is for. Sorting rides as the engine's `ordering` list on every mode. With
`urlSync` the view survives a reload and can be shared as a link.

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

`src/models/orders/Order.ts` (`OrderService`, `OrderModel`, the schemas) is
the Shim: 15 importers outside the slice — dashboard, equipment, building,
branch, invoice, mobile, the engineer-event form, `utils.js` — still call
its list, detail, insert, update, search, equipment-location list, the
unaccepted count and the twenty stats readers. What no caller used
(`detailUuid`, `getAllForCustomer`, `setAccepted`/`setRejected`,
`recreateWorkorderPdfGotenberg`, `getWorkorderData`, `getTopXCustomers`)
is gone. `Status.js` (`OrdersTable`, the dashboard log), `Orderline.js`
(`WorkOrdersTable`) and `OrderFilter.js` (the saved-filter screens) stay
for the same reason; `Infoline`, `Document`, `Month` and `Year` had no
caller left and are deleted.

`src/components/OrdersTable.vue` — the embedded orders block the customer,
equipment, location, building, branch and dashboard views mount — is also
not rewritten here: its consumers are legacy screens plus the two Customer
Slice views, and a TanStack copy beside it would be a second table drifting
from the first. The list's own columns are the same six the block shows.

## Testing notes

Recorded mutation score (StrykerJS, `npx stryker run --mutate
'src/features/order/**/*.ts' --mutate 'src/features/order/**/*.vue'` —
vitest runner, type checker on): **28 files, 1046 mutants, 45.98% detected
(481 of 834 valid; 212 with no covering test)** at the first full run,
against the Member Slice's 62.0% benchmark. The shortfall was three files,
since specced and re-scored on their own: `OrderDocumentsPanel.vue` 2% →
84%, `OrdersSchedule.vue` (shltr half, then `ScheduleShltr.vue`) 0% → 75% (against a real FullCalendar),
`ChartPairRow.vue` 0% → 100%.

After the split of the form, the detail and the list into their panels
and composables (`9e20f44d`…`117a13d2`), the `form/` and `order/` folders
re-scored together at **58.59% (696 killed of 1188 valid; 127 with no
covering test)** — `form/` 57.73%, `order/` 60.36%. The form spec gained
the equipment pickers, quick create, and the quotation and maintenance
seeds beforehand. The thin new SFCs (`DateTimeFields`, `EngineersPanel`,
`QuickCreateModal`, `ExtraRecipientsField`, `OrderInvoicesPanel`) score
low on their handful of mutants because the form and view specs drive
them through the DOM rather than in isolation; `use-order-seeds.ts`
(52%) and `OrderlinesPanel.vue` (43%) are the next to spec on their own.
Re-run the full command after the next change to this folder to record
the new whole-Slice figure.

`temps/` and the two by-tenant components (2026-09-15) are not yet
scored; `temps-form.spec.js`, `temps-view.spec.js` and the temps case in
`order-list.spec.js` drive them through the DOM. Score them with
`--mutate 'src/features/order/temps/**,src/features/order/Order*ByTenant.vue'`.

## Declared exceptions — the ledger

Behaviour the Slice deliberately changed, collected so a reviewer can tell
an intended fix from a refactor bug. URLs moved nowhere; the specs assert
the routes verbatim.

| Screen(s) | Exception | Why |
|---|---|---|
| List | Sorting is per column through `ordering`; the sort modal (`order_by` ∈ default/last_update) and its "orders since" date are gone | The bare-name grammar; `order_by` is documented as superseded by `ordering`, `since` by the `start_date` period filter |
| List | The wire never carries `order_by=default` | The legacy screen copied its radio's default onto every request |
| List | Search, filters, sort and page live in the URL | The kit's `urlSync`; the legacy list kept search and sort in component state and lost them on reload |
| List | The saved filters and the unaccepted count are read once per mount and refetched with the page, not re-read on every search, sort and delete | Each is its own query now |
| List, not-accepted | `user_filter` is dropped from the request | The action does not declare it; the legacy list sent it and the backend ignored it |
| List | The change-status modal is gone | Nothing opened it; the status column's select is the live path |
| List | The status *filter* offers every distinct status on record (`/order/filter/get_statuses/`), not the tenant's statuscodes | A code is only the prefix of a status; the legacy select filtered on codes and could not name "done left keys". The status *cell* still offers the codes, since that is what a user sets |
| List | The status select posts through the generated `orderStatusCreate` op, order-only | `TableStatusInfo` served three domains through their model services; the invoice and quotation lists keep it |
| List | A statuscode matches a status by case-insensitive substring | The legacy helper built a `RegExp` from the code; same result unless a code held a metacharacter |
| List | Delete confirms through the kit's modal, refetches through the list query key | Same modal id and copy |
| List | One screen for both member types; on a temps tenant the people column shows "Assigned to N / M people" | What `OrdersTable` rendered for temps; the legacy temps list's own extras (a sort modal, a change-status modal, a Documents link to a route that never existed) are not carried over — the kit sorts per column, the status cell sets a status |
| List, temps | The Not-accepted pill, the saved-filter pills, the unaccepted count and the websocket subscription apply to a temps tenant too | The legacy temps list had none of them; the endpoints behind them are not member-type specific |
| Form, temps | `customer_relation` (or `branch`) is sent, from the picked customer | The create serializer has required it since 2024-05-18; the legacy temps form never set it, so a fixed frontend would still have been refused |
| Form, temps | `required_users` is sent, as a positive integer or absent when blank | Never on a write serializer — see "The temps tenant" above; the legacy form sent it and it was dropped |
| Form, temps | The maintenance-contract and quotation seeds are not offered | Maintenance concepts; the legacy temps form did not have them either |
| Form, temps | The "add documents?" `confirm()` after a create is gone | It offered route `order-document-add`, which no router declared |
| View, temps | The Edit link carries `params: {pk}`; the detail also answers by uuid (`order-detail`) | The legacy temps view had the maintenance view's `pk`-beside-`params` slip, and only a pk route |
| View, temps | The status timeline is `StatusesComponent`, newest first | The legacy printed `created status` lines in the response's own order; the maintenance detail already uses the component |
| Workorder, temps | The public workorder page renders for a temps order | The legacy `Workorder.vue` rendered nothing for a temps tenant, while the temps view linked to it |
| View | The Edit link carries `params: {pk}` | The legacy link put `pk` beside `params`; vue-router resolved it without one. Same family as the Customer Slice's entry |
| View, by uuid | The Edit link, purchase invoices and regenerate button work | The legacy addressed all three with a `pk` that was null on that route; the public detail now carries the id |
| View | The workorder iframe gets its `src` on first open | The legacy bound it at mount too, to an empty string; binding the real address at mount would load the workorder page behind every closed modal |
| View | The documents block is a read-only list of the detail's `documents` | The legacy mounted the form's documents panel in view mode, which *deleted* any document with a null file as a side effect of opening the page |
| View | The purchase invoices are their own query and refetch alone after an add or delete | The legacy re-read the whole order after each |
| View | An orderline's equipment-name override is computed, not written back | Same rendering; the detail data is no longer mutated in place |
| View | The partner workorder line drops its `via` | The serializer declares no such field; nothing ever rendered there |
| View | The `past` prop still hides the regenerate button | Kept as declared; no route passes it |
| Workorder | The original order is read from `order.parent_order_data` | The legacy read it off the response's top level, where the schema does not declare it; the partner ids are declared there and read from there |
| Workorder | A failed read toasts | The legacy `created()` had no catch; the page stayed blank |
| Form | Blank optional strings and unpicked ids are absent from the body, not `''`/`null` | The parse output is the body |
| Form | `service_number` is gone | No serializer ever accepted it; what was typed there was discarded on submit |
| Form | The engineer picker is the whole select list (`/company/engineer/list-for-select/`), narrowed client-side | One read instead of one per keystroke; the list is short |
| Form | Sales users come from `/company/salesuser/?q=` | The sales-user resource, rather than the generic user list filtered by type |
| Form | Documents replay on edit too, with the save | The legacy replayed them on create only and left an edit's panel to its own Save button |
| Form | A time is sent as `HH:mm:00` | The serializer declares `HH:mm:ss`; the inputs take `HH:mm` |
| Form | A refused unassign names the engineer in the toast and aborts the save | The legacy toasted and still navigated away |
| Form | The quotation route is a sibling of the maintenance route | As a child it rendered the parent's props: the form has no nested router-view |
| Form | The customer form no longer requires the address | The customer serializer does not, and the customer's own record fills it |
| Schedule | The range is sent as `YYYY-MM-DD` | The legacy built `2026-9-1`; the op declares dates |
| Schedule | Events and the clicked order go through the query cache | Same requests; a range revisited within the cache window is not refetched |
| Schedule | The `start`/`end` route params are not taken | Neither design ever read them |
| Stats | The wire carries `order_type` and `year` (and `month`) only | The legacy rode BaseModel's list and sent a meaningless `page=1` too |
| Stats | Series colours are a deterministic hue walk | The legacy rolled `Math.random()` per label and forgot it on reload |
| Stats | Month names come from `Intl`, in the session language | The legacy loaded moment with every locale for two labels |
| Stats | The page shows the last data while a new period loads | The query cache; the legacy blanked the charts |

## Manual browser checklist

Walk the orders list against a development tenant after any cross-cutting
change: the All / Not accepted pills, a saved-filter pill (address bar shows
`user_filter=`), a status change from the row select, a delete, and on
`/mobile/orders` the Assign icon and the selection strip. On the detail:
the workorder modal (iframe, PDF download, regenerate), and on a branch
tenant the purchase-invoice add and delete. On a temps tenant: the people
column counts heads, the form has "Required users" and no engineer or
infoline sections, a create lands with the number typed there (once the
backend declares the field), and the detail shows the headcount.
