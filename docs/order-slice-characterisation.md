# The Order Slice — characterisation

What the legacy order screens do today, pinned before anything moves. Read
this with `docs/agents/feature-refactoring-guide.md` (the procedure) and
`src/features/customer/README.md` (the reference slice). Written 2026-09-13
on `feature/refactor-order-slice`, branched from `develop` after the
Statuscode Slice merged.

## Scope

In: everything the order router mounts, plus the order-domain code that only
those screens use.

```
src/router/orders.js                 the routes (below)
src/router/helpers.ts                createUserFilterRoutes — the saved-filter routes,
                                     also mounted by router/settings.js
src/router/mobile.js                 mounts OrderList three more times (dispatch modes)

src/views/orders/
  OrderList.vue                      → OrderListMaintenance (the temps variants were retired on this branch)
  OrderForm.vue                      → OrderFormMaintenance
  OrderFormMaintenance.vue           role dispatch → ...Planning | ...Customer | ...Employee
  OrderView.vue                      → OrderViewMaintenance
  Workorder.vue                      member-type dispatch → WorkorderMaintenance (temps: renders nothing)
  Schedule.vue                       theme dispatch → schedule/ScheduleShltr | ScheduleDefault
  YearStats.vue, MonthStats.vue
  order_form/DocumentsComponent.vue  the order documents panel (form + view)
  schedule/scheduleMixin.js, ScheduleOrderModal.vue

src/views/shared/UserFilterList.vue, UserFilterForm.vue   saved order filters (only `order` type exists)

src/models/orders/
  Order.ts, order-schemas.ts         the service, the valibot form/read/write schemas
  Orderline.js, Infoline.js, Document.js, Status.js, OrderFilter.js, Month.js, Year.js
  (Cost.js moved to models/invoices on this branch — its only callers are the invoice screens)
  Invoice.js, InvoiceLine.js, InvoiceStatuscode.js, Action.js, Statuscode.js   dead (no live importer)
src/models/base_user_filter.js       the filter-condition model the two UserFilter screens share

src/components/
  OrdersTable.vue                    the shared orders table (13 consumers across 6 domains)
  WorkOrdersTable.vue                dashboard + equipment view
  OrderTypesPie.vue                  dashboard, equipment view, OrderStats, StartpageOrderStats
  OrderTypesSelect.vue               the four order forms + both stats pages
  OrderStatusColorSpan.vue           both stats pages
  SubNavOrders.vue                   the order sub-navigation (also the user-filter routes' subnav)
  UserFilters.vue                    the saved-filter pills on the maintenance list
  TableStatusInfo.vue, StatusesComponent.vue   shared with invoice and quotation screens — NOT ours

src/utils.js  doFetchUnacceptedCountAndUpdateStore   (list → store.unacceptedCount → SubNavOrders badge)
```

Out, deliberately: `mobile/Assign` and everything in `views/mobile` (planning),
`EngineerEvent*` (planning), `TableStatusInfo`/`StatusesComponent` (three
domains share them), `Cost` (invoice/quotation screens own the only callers).

## Routes

| name | path | component | props | auth |
|---|---|---|---|---|
| `order-list` | `/orders/orders` | OrderList | — | customer, employee |
| `orders-not-accepted` | `/orders/orders-not-accepted` | OrderList | `queryMode: 'unaccepted'` | customer, employee |
| `mobile-orders` / `-in-progress` / `-finished` | `/mobile/orders…` | OrderList | `dispatch: true, queryMode: dispatch\|inprogress\|finished` | (mobile.js) |
| `order-add` | `/orders/orders/form` | OrderForm | — | |
| `order-edit` | `/orders/orders/form/:pk(\d+)` | OrderForm | `pk` | |
| `order-add-maintenance` | `/orders/orders/form-maintenance` | OrderForm | `maintenance: true` | |
| `order-add-quotation` | `…/form-maintenance/:quotation_id` | OrderForm | `quotation_id, from_quotation: true` | ⚠ see defects |
| `order-view` | `/orders/orders/view/:pk` | OrderView | `pk` | |
| `order-detail` | `/orders/orders/detail/:uuid` | OrderView | `uuid` | |
| `workorder-view` | `/orders/orders/workorder/:uuid` | Workorder (empty layout) | `uuid` | `needsAuth: false` |
| `orders-schedule`, `orders-schedule-params` | `/orders/schedule[/:start/:end]` | Schedule | `start, end` (unused by both variants) | planning, employee, customer |
| `order-year-stats`, `order-month-stats` | `/orders/year-stats`, `/orders/month-stats` | YearStats, MonthStats | — | customer, employee |
| `order-filter-list/-add/-edit` | `/orders/filter[/form[/:pk]]` | UserFilterList / UserFilterForm | `type: 'order', route_name_part: 'order'` | |
| `settings-order-filter-*` | `/settings/filter…` | same two views | `from_settings: true` | planning |

Every route except `workorder-view` mounts `SubNavOrders` in `app-subnav`.
The form's `unaccepted` prop is declared on all four variants but no route
ever passes it.

## Screens and their wire traffic

Paths are the legacy `/order/...` (BaseModel prepends `/api`). `[q]` = the
query BaseModel builds: `page`, then `q`, `user_filter`, `order_by`, `since`
when set, then `sort_field`/`sort_dir` when a column sort is set, merged over
any `listArgs`.

### OrderListMaintenance (maintenance tenants)

Mounted with `:key="$route.fullPath"`, so every route change remounts and
re-runs `created()`.

`created()` → `mainStore.getStatuscodes`, then `seedFromRoute($route.query)`
(page, q, sort_field/sort_dir), `since` and `order_by` from the query,
then `loadData()`.

`loadData()` in order:
1. `GET /order/filter/simple_list/` (the saved-filter pills)
2. `GET /order/order/all_for_customer_not_accepted_count/` → `store.setUnacceptedCount`
3. `store.getAssignOrders` → `selectedOrders`
4. `model.setUserFilter($route.query.user_filter)`
5. `GET <list url>?[q]` where the list url is by `queryMode`:
   `all → /order/order/`, `unaccepted → …/all_for_customer_not_accepted/`,
   `dispatch → …/dispatch_list_all/`, `inprogress → …/dispatch_list_inprogress/`,
   `finished → …/dispatch_list_finished/`, `range → …/get_within_range/`

Sort modal: `order_by` ∈ {`default`, `last_update`} (radio) and a `since` date;
OK re-lists. Search form: `q`, page reset to 1. Both are component state
only — the URL is not updated (unlike the kit's `urlSync`). Only the
`page` link (Pagination component) and the `user_filter` pill write the URL.

Row actions: Assign (dispatch mode, not customer/branch-employee) pushes into
`store.assignOrders` and `doAssign` navigates to `mobile-dispatch` with
`assignModeProp: true`; Delete → modal → `DELETE /order/order/{id}/` → toast →
`loadData()`.

Websocket: subscribes `MemberNewDataSocket` for `UNACCEPTED_ORDER`; an
`ORDER_ACCEPTED`/`ORDER_REJECTED` message re-runs `loadData()`.

Pills: All / Not accepted (hidden on `/mobile/*`), plus one pill per saved
filter (`UserFilters.vue`: toggles `?user_filter=<id>&page=1` on the current
route). On `/mobile/orders` a single All pill pointing at `mobile-orders`.

Dead code inside it: the change-status modal (`showChangeStatusModal` has no
caller; `TableStatusInfo` inside `OrdersTable` does status changes itself),
`rowStyle`, `fields`, `orderLineFields`, `infoLineFields`, `status2color`.

### OrderListTemps, OrderFormTemps, OrderViewTemps — retired

Removed in `0de053c1` on this branch: the temps form could not save since
2024 and nobody noticed. The temps *tenant type* still exists (trips,
student users); a temps tenant now gets the maintenance order screens.

### OrderFormMaintenancePlanning (planning / staff / superuser)

The 1975-line one. Create: `OrderModel()` blank; if `from_quotation`:
`GET /quotation/quotation/{id}/` → `GET /customer/customer/{customer_relation}/`
→ fills customer, `quotation`, `order_reference`. If `maintenance`: reads
`store.getMaintenanceEquipment` `{maintenanceEquipment, customer_pk,
contract_pk}` → `GET /customer/customer/{pk}/` and one
`GET /equipment/equipment/{pk}/` per row → stages orderlines with
`equipment`, `equipment_location`, `maintenance_contract`. Edit:
`GET /order/order/{pk}/`, dates parsed, order type trimmed, sales-user picker
seeded from `order_email_extra`.

Autocompletes (debounced 500 ms): customers `GET /customer/customer/autocomplete/?q=`,
branches `GET /company/branch/autocomplete/?q=`, engineers
`GET /company/user-list/?q=&user_type=engineer`, sales users
`…user_type=sales_user`, equipment / locations by branch or by customer
(`searchBranch`/`searchCustomer` on the two services), quick-create equipment
and location (`quickAdd{Customer,Branch}{Planning,NonPlanning}` — which one
depends on the tenant's `setting_equipment_*_quick_create` flags).

Submit (in this order, all awaited): validate → strip `orderlines`/`infolines`
off the order → `POST /order/order/` or `PATCH /order/order/{pk}/` → orderlines
(`POST`/`PATCH /order/orderline/`, `DELETE` for the removed) → infolines
(same on `/order/infoline/`) → engineers: `POST /mobile/unassign-user/{user_id}/`
for each removed, `POST /mobile/assign-user/{user_id}/?notify_user=1` for each
added → documents (`DocumentsComponent.orderCreated(pk)`, create only) →
`$router.go(-1)`. Accept/reject buttons: `POST /order/order/{pk}/set_order_accepted/`
/ `…set_order_rejected/`.

Pinned already: `tests/unit/views/orders/order-form-maintenance-planning.spec.js`
(create body, dates, `order_email_extra`, orderlines/infolines, engineers,
edit load, cancel, autocompletes).

### OrderFormMaintenanceEmployee (branch employee)

Subset of Planning: `GET /company/branch/my_branch/` on create seeds the
branch; equipment/location autocomplete via `searchBranchEmployee`; no
customer, engineer, infoline or quotation handling. Submit: order → orderlines
→ `go(-1)`. Pinned: `order-form-maintenance-employee.spec.js` (cancel, the two
autocompletes only — the submit sequence is **not** pinned).

### OrderFormMaintenanceCustomer (customer user without branches)

Reads `authStore.user.customer_user.customer` → `GET /customer/customer/{id}/`
to prefill the order's customer block on create. Submit: order → orderlines
→ `go(-1)`. **No spec at all.** Binds `service_number`, which no serializer
accepts (documented in `Order.ts`).

### OrderViewMaintenance

`GET /order/order/{pk}/` or `GET /order/order/detail/{uuid}/`; when the
tenant uses equipment, orderline `location`/`product` are overwritten from
`equipment_location_view.name` / `equipment_view.name`. When the tenant has
branches: `GET /invoices/purchase-invoice/?order={id}&page=1` and the
purchase-invoice add/delete modals (`POST`/`DELETE /invoices/purchase-invoice/`,
then reload). Workorder modal: iframe on the `workorder-view` route;
"re-generate PDF" → `POST /order/order/{pk}/recreate_pdf/?gotenberg=1` →
reload. Links out: `order-edit`, `customer-view`, `invoice-create`
(`{uuid}`), `invoice-edit`, `invoice-view`. Pinned: the uuid load and the
recreate call only.

### WorkorderMaintenance

`GET /order/workorder-data/{uuid}/` (unauthenticated route), picks
`member.companylogo_workorder || member.companylogo`,
`store.getWorkorderShowRelatedOrders`. Pinned: the call.

### Schedule (both variants via scheduleMixin)

FullCalendar; events source `GET /order/order/month_events/?start=Y-M-D&end=Y-M-D`
(no zero-padding — `getMonth()+1` and `getDate()` raw; the range is whatever
FullCalendar asks for, which spans the visible grid, not the month). Event
click → `GET /order/order/{id}/` → `ScheduleOrderModal`. Shltr adds an
order-type legend that hides/shows loaded events client-side and a header
with prev/next/today/view buttons; Default uses FullCalendar's own toolbar.
The `start`/`end` route params are declared and never read. Not pinned.

### YearStats / MonthStats

`GET /order/order/year_list/?order_type=<all|type>&year=Y&page=1` and
`GET /order/order/month_list/?order_type=…&year=Y&month=M&page=1` (the `page`
is BaseModel's, meaningless here). Colours from `my24.status2color` over
`store.getStatuscodes`. Not pinned. Contains dead/broken helpers
(`denormalizeOrderType` calls `this.orderType()` on a string).

### UserFilterList / UserFilterForm

List: `GET /order/filter/?page=…`, delete modal → `DELETE /order/filter/{pk}/`.
Search modal is wired to `this.model.setSearchQuery` where `model` is the
*class*, so searching throws. Form `created()` fires seven reads in sequence:
`get_fields/`, `get_non_text_field_types/`, `get_operators/`, `get_statuses/`,
`get_status_fields/`, `get_base_filter_options/`, then `get_examples/` (create)
or `GET /order/filter/{pk}/` (edit). Submit → `POST`/`PATCH /order/filter/`
with `{name, base_filter, json_conditions[], querymode}` → `go(-1)`. The
condition model (`base_user_filter.js`) is the legacy JSON filter grammar. Not
pinned.

### DocumentsComponent (order_form/)

`GET /order/document/?order={id}` on an existing order (or takes
`order.documents` when the detail already carries them), then deletes any
document with a null `file` (`DELETE /order/document/{id}/`, fire-and-forget).
Files are read as base64 data-URLs into a staged collection;
`submitDocuments()` / `orderCreated(pk)` replay the collection through
`BaseModel.updateCollection()` (POST new, PATCH changed, DELETE removed; an
`http…` file value is stripped before PATCH). Not pinned. The Customer Slice
has `features/customer/document/DocumentPanel.vue` for the same concept on
`/customer/document/`.

## Cross-slice dependencies

Reads the order feature will make against other domains (all have generated
ops; none needs the other domain's legacy model):

| from | endpoint | who |
|---|---|---|
| customer | `/customer/customer/{id}/`, `…/autocomplete/` | planning + customer forms, quotation prefill |
| company | `/company/branch/autocomplete/`, `…/my_branch/`, `/company/user-list/?user_type=` | planning + employee forms |
| equipment | `/equipment/equipment/…`, `/equipment/location/…` (search, quick-add, detail) | planning + employee forms |
| quotation | `/quotation/quotation/{id}/` | planning form (from quotation) |
| mobile | `/mobile/assign-user/`, `/mobile/unassign-user/` | planning form |
| invoices | `/invoices/purchase-invoice/` | maintenance view |
| statuscode | `store.getStatuscodes` (already a feature) | lists, stats, OrdersTable |

Store state the screens share with the rest of the app: `unacceptedCount`
(SubNavOrders badge, written by the list), `assignOrders` (list ↔ Dispatch),
`maintenanceEquipment` (MaintenanceContractView → planning form),
`orderListMustIncludeReference` (OrdersTable).

## What must survive as a shim

`OrderService` / `OrderModel` from `models/orders/Order.ts` — 23 importers
outside the slice (dashboard mixins, equipment/location/building/branch views,
invoices, quotations, mobile Dispatch/Trip, EngineerEvent form, `utils.js`).
`Status.js` (`OrdersTable` and the dashboard log). `Orderline.js`
(`WorkOrdersTable`, dashboard). `Same shape as
`models/customer/Customer.js`: keep what the callers use, derive from the
generated schema, nothing else.

## Existing coverage

| area | spec | pins |
|---|---|---|
| model | `tests/unit/models/order-schema.spec.js`, `order-schemas-defaults.spec.js` | form/read/write schema shapes, defaults, dates |
| model | `order-service-methods.spec.js`, `order-stats-urls.spec.js`, `order-write-validation.spec.js` | every service URL, `getListArgs`, the 20 stats URLs, insert validation |
| planning form | `views/orders/order-form-maintenance-planning.spec.js` | see above — the strongest spec in the slice |
| employee form | `order-form-maintenance-employee.spec.js` | cancel, two autocompletes |
| view | `order-view-maintenance-call-shape.spec.js` | uuid load, recreate PDF |
| workorder | `workorder-maintenance-call-shape.spec.js` | the data call |
| pie | `components/order-types-pie-call-shape.spec.js` | stats filter selection |

Not pinned anywhere: **both list variants**, the saved-filter list and form,
the schedule, both stats pages, the customer form variant, the employee form's
submit sequence, `DocumentsComponent`, `OrdersTable`, `WorkOrdersTable`,
`SubNavOrders`.

## Suspected defects (verify before deciding preserve vs. fix)

Each of these goes in the ledger as an exception if the rewrite fixes it.

1. ~~OrderFormTemps cannot save~~ — retired (`0de053c1`).
2. **Edit link on both views** — `:to="{name:'order-edit', pk: pk}"` puts
   `pk` beside `params`, not inside; vue-router resolves it without the
   param. Same family as the Customer Slice's "Edit-customer link carries
   `params`" entry.
3. ~~`order-documents` route~~ — went with OrderListTemps.
4. **`order-add-quotation`** is a *child* of `order-add-maintenance` with the
   same named components, but `OrderForm` renders no nested `<router-view>`,
   so the child's `from_quotation`/`quotation_id` props most likely never
   reach the form; the parent's `{maintenance: true}` renders instead.
   `QuotationList` is the only caller. Check in the browser.
5. **UserFilterList search** throws (`this.model.setSearchQuery` on a class).
6. **Maintenance list** carries a whole change-status modal nothing opens.
7. **YearStats** `denormalizeOrderType` calls a string; `year` is computed
   at module load (`new Date()` outside the component).
8. **Schedule** builds unpadded dates (`2026-9-1`); the backend evidently
   accepts them, but the generated op's `start`/`end` are typed date strings.
9. The maintenance list re-fetches the saved filters and the unaccepted
   count on **every** reload (search, sort, delete, websocket ping) — three
   requests where one changed.

## Open questions for the second step (the new filter grammar)

- Decided 2026-09-13: the order list is built against the bare-name grammar
  the Customer list uses, ahead of the backend landing it. The saved-filter
  subsystem (`/order/filter/`, `base_user_filter.js`, the two UserFilter
  screens, `?user_filter=`, `UserFilters.vue`) is the legacy way of doing
  the same thing and is **not migrated**: the legacy screens stay mounted
  untouched until they are retired or rebuilt as named URLs.
- The table kit's `filterVariant: 'select'` / `meta.selectOptions` column
  option was deleted in `2b2b89aa` (no consumer at the time); restore it from
  that commit for the status and order-type columns.
- `order_by` (`default` | `last_update` | `-start_date`) and `since` are
  list-specific sort/filter params outside both grammars. Kept, or folded
  into `ordering` + a `start_date__gte`?
