# The field-service Slice — the planning console over the mobile workforce

The `/mobile/*` screens: the week board a planner dispatches from, the engineer
map, the assigned-finished list, the timesheets and trips — plus the engineer
events (`/company/engineer-users/events` and `/company/engineer-users/event-types`),
which are what the mobile workforce reports back and what a planner attaches an
order to. This directory follows the Member Slice
(`src/features/member/README.md`, the reference implementation) and the Customer
and Equipment Slices: the same rules, the same testing bar.

**These are not the engineer's phone app.** The Flutter application in
`../my24-mobile` owns that surface; `scripts/usage-gate/mobile-callers.json`
shows it calling `assignedorder*`, `assign-me`, `assign-user` and the leave
accept/reject pair. What is here is the console: a route with no
`authLevelNeeded` meta defaults to `AUTH_LEVELS.PLANNING`
(`src/router/mobile.js` carries no meta at all), so every screen in this Slice is
a planning screen.

## Layout

```
index.ts              the one door; src/router/mobile.js and the engineer-event
                      routes in src/router/company.js mount what is exported here
invalidation.ts       the query keys this Slice invalidates, one helper per resource
assignment/           the assign/unassign/availability concept both sides share:
                      the user shape (assigned-user) and the two write pairs
                      (use-order-assignment, use-trip-assignment)
dispatch/             the maintenance-flavour board and what hangs off it:
                      Dispatch (the week board), DispatchWeek (the grid),
                      UserData + OrderInfo (a row and its order box),
                      SearchAndAssign + EditStartDate (the pick and the date edit),
                      TimeInput, EngineerMap, AssignedFinished
trips/                the temps-flavour side: TripList, TripForm, TripAvailability,
                      TripAvailabilityDetail and their schemas
hours/                the timesheets: TimeSheet, TimeSheetDetail, the two
                      UserHoursData pivots, useUserHoursPivot, hours-fields
engineer-event/       what the engineers' devices reported and what a planner
                      attaches to it: EngineerEventList (the events, with the
                      attach-order modal), EngineerEventTypeList and
                      EngineerEventTypeForm, EngineerEventOrderForm,
                      EngineerPills (both pill rows), schemas, invalidation
```

Organised by product flavour and entity, not by screen kind, which is what the
rest of this repo does. `assignment/` is the cross-cutting module: the two sides
reach the same concept — a user committed to work — through two pairs of
endpoints, and copying the pair into each folder would be two declarations of one
idea.

## One slice, not two

The obvious split is maintenance (dispatch, the engineer map, assigned-finished)
against temps (trips, trip availability) — the nav section already gates them on
`profile.flavour` (`src/components/navSections.ts`, the `mobile` array). It was
not taken, deliberately:

- The two sides share the assignment concept and its endpoints, the
  `assignedorder` resource behind every one of them, the route file, and the nav
  section. Splitting would put the assignment module in one slice and its second
  user in another.
- The flavour gate is a property of a *nav entry* and of which module a tenant
  has, not of the code: `hasAccessToModule('mobile', 'trips') && flavour ===
  'temps'`. No screen branches on the flavour except the map, which is a
  maintenance feature by product decision.
- Routes for both sides are one tree in one file (`src/router/mobile.js`), and a
  Slice is "one view directory, the model directory it owns, and every route that
  mounts them" (CONTEXT.md) — that is this tree.

If the two sides ever diverge far enough to need separate doors, the sub-folders
are already the seam.

## The schema does not describe this Slice's endpoints

Eleven asks went to the backend from this conversion and ten are answered — the
first five in `4f5bab97`, the rest by the same issue afterwards. Every call site
that worked around one is gone and every spec that had been split off the strict
seam is back on it, including this Slice's last client-fake spec, the
attach-order modal's. One ask was declined, and it is all that is left:

| Endpoint | What the schema misses | Consequence |
|---|---|---|
| `/api/company/engineerevent/` | No `q` and no `page_size`. The GET declares `engineer` and `page` alone: the view is the one place in this Slice that is not a `BaseMy24ViewSet`, so it carries no `SearchFilter`, and it pages on DRF's own `PageNumberPagination`, which reads the project's `PAGE_SIZE` (50) rather than a parameter (my24service `source/settings/default_settings.py:357`) | The events list has **no search field** — a control that sends a parameter nothing reads is worse than none — and pins its page size to 50 in both the request and the pager, because 50 is the page the backend returns |


The answered asks retired more than their casts. `list_timesheet_totals`
declares `mode`, `month`, `start_date`, `user_id` and `year`, so the two
Timesheet screens moved off the client fake and onto the seam;
`finished_list` declares `month`, `year` and `submodel_id`, so the month
window did too; `trip_availability_detail` declares the bundle it answers, so
its spec stubs an ordinary value instead of an explicit `HttpResponse`; and
`order/order/autocomplete/` declares the bare array the action returns, so the
trip form's type-ahead reads the response as it is.

The three asks this Slice forwarded itself are the ones a user can see.
`order_type` left the required list of all four `OrderCreate*Request`
components, so the attach-order modal's create goes out uncast and unswitched;
`assigned_order` is declared on the PATCH's own component
(`PatchedEngineerEventAttachOrderRequest`), so the attach is typed like any
other write; and `/api/company/engineerevent/{id}/` (DELETE) is new, which is
what lets the events list offer the row action the legacy screen had and could
never complete. The two inventory operations declared here are answered too, but
the only screen that sent them was `AssignedOrderMaterial`, which is deleted —
nothing in this Slice calls them.

`tests/unit/support/api-client-mock.js` gained `getConfig` when the Timesheet
lists were still on it: the generated `*QueryKey` factories ask the client for
its `baseURL` when they build a key, which the four verbs alone did not answer.
Those screens are on the seam now, and so is the attach-order modal, so this
Slice has no client-shape spec left; the fake keeps answering `getConfig` for
the ones that remain elsewhere in the suite.

## Declared exceptions — the ledger

Behaviour the Slice deliberately changed, collected so a reviewer can tell an
intended fix from a migration bug. URLs moved nowhere; each screen asserts its
routes verbatim.

| Screen(s) | Exception | Why |
|---|---|---|
| Dispatch board | The refresh button re-reads the week | The legacy button only set the start date to today, and a board already showing this week kept its stale rows. The week's query is keyed by the date string, so a new `Date` object with the same date is the same query |
| Dispatch board | The board re-reads itself after a write, through the query key | `refreshData()` called `$refs['dispatchComponent'].loadData()`; a write now invalidates the window's key, which is the same request without the parent reaching into the child |
| Dispatch board | Grid rows are keyed on `user_id` | The legacy keyed them on `item.id`, which the window's rows do not carry, so every row shared one key |
| Dispatch board | Order actions read the order through `queryClient.fetchQuery(orderOrderRetrieveOptions(...))` with a **string** id | The retrieve path is declared `string` (pk or uuid) and the generated client validates it; the number the grid carries fails before the request |
| Change date, Split | The bodies carry `alt_start_time`/`alt_end_time` | `AssignedOrderDatesSerializer.Meta.fields` declares the four `alt_*` keys; the legacy sent the model's own `start_time`/`end_time`, which DRF ignored — editing a time in either modal did nothing. Regression test in `dispatch.spec.js` |
| Change date, Split | Times are sent as `HH:mm:ss` | The request schema declares `isoTimeSecond` and the generated client validates the body before sending, so the field's `HH:mm` would be refused. The field still shows and accepts `HH:mm` |
| SearchAndAssign | A staged date edit sends ISO dates, not `dd/mm/yyyy` | `vPatchedOrderUpdateRequest.start_date` is `v.isoDate()`. DRF reads both spellings (`DATE_INPUT_FORMATS = ['iso-8601', '%d/%m/%Y']`, my24service `source/settings/default_settings.py:361`), so the stored date is the same. Regression test in `search-and-assign.spec.js` |
| SearchAndAssign | The results are re-read after that edit instead of patched in place | The collection shows the *display* spelling the backend formats per tenant, which a locally patched ISO string would not match |
| SearchAndAssign | The staged orders and the search term are the query's and the store's, not a model singleton's | `OrderService.setSearchQuery` was module state shared with every other caller of that model |
| AssignedFinished | The list runs on the shared table kit; its month arrows are in the toolbar | The kit owns the title, the search box, the refresh button and the pager. The table id `#assigned-finished-table` went with the legacy shell; the spec's selectors moved and nothing else |
| AssignedFinished | `page_size=20` is sent | The kit's page size, and the API's own default, so the same page is asked for |
| AssignedFinished | `month`/`year` are sent only once the planner has moved the month | They are the endpoint's own default until then, and defaults stay out of the request — as defaults stay out of the address in the table kit |
| EngineerMap | One read instead of two, and the markers follow it | The legacy fetched the locations in `created()` and again in `mounted()` before plotting, then never re-plotted: the Refresh button could not change the pins. Regression test in `engineer-map.spec.js` |
| navSections | The dead 'Trip statuscodes' entry is gone | `trip-statuscode-list` is defined by no router in this repo (`src/router/**` has no such name), so the entry navigated nowhere. The trip-statuscode *endpoints* exist; the screen they were meant to open was never written. A route a planner can see and cannot reach is worse than no route |
| All lists | Header, panel, delete modal and pager come from the shared table shell | Same copy, same modal ids, same wire |
| Timesheets | No `page=1`; the detail's overlay covers the first load; the week arrows re-read in place | The action is unpaginated and ignores the page; the legacy detail painted an empty grid before its first read |
| Timesheets | The module-level `TimeSheet` model singleton is gone | `setListArgs` on a shared instance meant the detail screen's `user_id` overwrote the list's arguments. One query per screen now; regression test in `hours-timesheet.spec.js` |
| TripForm | The two time fields are text inputs, and their times go out as `HH:mm:ss` | `<b-form-timepicker>` **does not exist** in bootstrap-vue-next 0.42 — the legacy tag rendered as an inert unknown element — and a time is required whenever the trip is not timed "from the first/last job", so every such trip was unsavable. The ids are unchanged; the request schema declares `isoTimeSecond` |
| TripForm | `required_users` is sent as a number, checked by the form | The generated entry is an int64 union whose transform produces a **bigint**: `JSON.stringify` cannot encode one, and a non-numeric string makes `BigInt('abc')` throw *inside* the transform, where `safeParse` does not catch it. The one entry the form does not take from codegen |
| TripForm | The body carries the declared keys only | The parse keeps what the schema declares: `user_trip_is_available`, `last_status`, `last_status_full`, the record's `id`, `statuses` and the counts no longer ride the wire, and each staged row is `{order}` rather than its six display fields |
| TripForm | The country selects carry the ids their labels name | The legacy `label-for="start_country_code"` pointed at a `BFormSelect` with no `id`, so neither label focused anything |
| TripForm | The order type-ahead's loading state is the search's, not the form's | Typing an order put the whole form under the overlay. The endpoint declares the bare array it answers, so the picker reads the response as it is |
| TripAvailability | A failed load tells the user | Its catch called `errorToast` without importing it, so the legacy screen raised a ReferenceError and showed nothing |
| TripAvailabilityDetail | The assign and unassign go through `useTripAssignment`, and the redraw is that query's invalidation | Same two requests, without a hand-rolled reload |
| Trips lists | Sorting is off and no `ordering` is sent | The legacy headers sorted only the rows already loaded — the endpoints declare no `ordering` parameter, so the sort never reached the wire |
| Trips lists | Page and search live in the URL | The kit's `urlSync`; the legacy read `$route.query.page` alone |
| EngineerEventList | Its "last event duration" cell renders | REGRESSION. `componentMixin.displayDurationFromSeconds` (`src/mixins/common.js:100`) calls `moment` without importing it and nothing in this application sets a global one, so the legacy cell raised a ReferenceError on every row and showed nothing. The screen now formats through `hours/hours-fields`, the Slice's own copy of the same function. Regression test in `engineer-event-list.spec.js` |
| EngineerEventList | The row's delete is back, through the shell's `deleteModal` | REGRESSION, repaired. The legacy `showDeleteModal` wrote a data property the component never declared and then reached for `$refs['delete-event-type-modal']` while the modal was `delete-event-modal`, so the click raised a TypeError before anything opened — and the view had no detail route to call either. `/api/company/engineerevent/{id}/` (DELETE) exists now; the kit owns the modal, the confirmation and the refetch, under the same id (`delete-event-modal`) and copy the legacy used. Regression test in `engineer-event-list.spec.js` |
| EngineerEventList | The list asks for `page` alone, and pages by 50 | The endpoint is a plain `ListCreateAPIView` on DRF's own `PageNumberPagination`, whose `page_size_query_param` is unset (`DEFAULT_PAGINATION_CLASS`, my24service `source/settings/default_settings.py:357`) and whose page is the project's `PAGE_SIZE`, 50. The legacy pager counted 20 and rendered the 50 the server sent. The kit is told `pageSize: 50` and sends no `page_size`, which the seam would refuse |
| EngineerEventList | No search field | The same view is the one place in this Slice that is not a `BaseMy24ViewSet`, so it carries no `SearchFilter` and declares no `q`. The field is the kit's first opt-out (`searchable`), added to `ServerTable`/ListPageHeader` |
| EngineerEventList, EngineerEventTypeList | The engineer pills render for every tenant | The legacy row was `v-if="companycode === 'grm'"`. Nothing in this application branches on a company code (AGENTS.md: family is `profile.family`, flavour `profile.flavour`), the three entries are this Slice's navigation rather than a per-tenant product decision, and the row's own `useCompanyUserPills` entries already carry their module, member-type and flavour guards. The same removal `features/workforce/SubNav.vue` made for its own row; `dispatch/EngineerMap.vue` is the sibling precedent for the product difference behind that code — it moved to the nav section's `profile.flavour` |
| EngineerPills | The active entry is the route's name | REGRESSION. The legacy `setActive` read `$route.path.split('/')` and treated a four-segment path as "the engineers list", so **both** event screens ("…/events", "…/event-types") marked "List" active. `PillsNav` settled the same question by route name. Regression test in `engineer-event-list.spec.js` |
| EngineerEventTypeList | Sorting is off and no `ordering` is sent | The legacy headers set `sortable` on five columns, but `EngineerEventTypeViewset` declares no `ordering` allow-list, so the sort only reordered the rows the page already held |
| EngineerEventTypeList | The search is the kit's inline field, not the legacy modal | Same `q` on the wire; the endpoint declares it, and the kit's field is a plain input the header already carries |
| EngineerEventTypeList | The delete confirmation is the kit's | Same id (`delete-event-type-modal`), same copy, same `DELETE /{id}/`, and the write invalidates the list query instead of a hand-rolled reload |
| EngineerEventTypeForm | Both bodies carry the three declared keys | The parse output is the body: the legacy create posted its model's `fields` bag (`{id: null, event_type}`) and the edit PATCHed the whole record back — `id`, `created`, `modified`, `statuscode_view` and the three counts |
| EngineerEventTypeForm | A blank "Measure last event type" rides as `null` | The generated entry is `nullish`; the legacy deleted the key, which meant an edit could never clear the field. Same rule the statuscode Slice's ledger states for blank optional text |
| EngineerEventOrderForm | The assign goes through the Slice's `useOrderAssignment` | The Shim it replaces sent the identical request; the shared composable declares it once for the board, the trips and this modal, and the assign now also invalidates the dispatch board the assignment appears on |
| EngineerEventOrderForm | The customer search is a debounced query over the generated autocomplete | Same 500 ms debounce and same `q`; it was `customerModel.search`, and an empty term asks for nothing, as before |
| EngineerEventOrderForm | The order body is the fields the modal fills, not the form's default bag | The legacy posted `orderModel.getFields()` — 35 keys, of which `service_number`, `required_users`, `orderlines`, `infolines`, `statuses`, `workorder_documents` and `work_pdf_url` are ones DRF drops (`src/models/orders/Order.ts:49-67` says so). The modal's own fields and the two dates ride; nothing else |
| EngineerEventOrderForm | The order create sends no `order_type` | The modal never asks for one and the backend's field is `null=True, blank=True`, so the create is legal. The document requires the key no longer, so the call site is an ordinary generated mutation with its request validator on, and the spec asserts the body through the strict seam |

### Preserved defects

- **SearchAndAssign's status dot is always the fallback grey.**
  `my24.status2color(statuscodes, status)` returns the default when `status` is
  falsy, and the legacy passed `this.orderStatusCode`, which is never set. The
  conversion kept the same call and the same result rather than inventing a
  colour rule.
### Deleted rather than kept

- **`AssignedOrderMaterial`.** `src/router/mobile.js` imported it and mounted it at
  no route, and the conversion preserved that rather than invent a URL for it. It
  has now been deleted together with its `schemas.ts`, its spec and
  `invalidateAssignedOrderMaterials` — nothing else called any of them, and a
  finished Slice should not carry dead UI. The `assignedordermaterial` endpoints
  stay live: the Flutter application reads and writes them, and only the web
  screen is gone.

### A kit limitation this Slice hit

`ServerTable`/`ServerDataTable` take no `id`, so the two trips lists lost the
legacy `trip-table` id. Nothing selects on it in the application, and the
slice's own specs moved to the kit's markup, so it was accepted rather than
worked around — but a screen that needs a stable table id has no way to ask for
one today. That is a kit decision, not a slice one.

The legacy pager's `aria-controls` is not part of that loss: `components/
Pagination.vue:16` hardcoded `aria-controls="order-table"` on every screen that
mounted it, so the trips list pointed at the order table. The kit's pager
carries no `aria-controls` at all, which is the honest state until a screen has
a table id worth pointing at.

## The Shim this Slice leaves behind

**None.** `src/models/mobile/Assign.js` was the last one, and the engineer-event
screens were its last caller: the attach-order modal now assigns through the
Slice's own `useOrderAssignment`, and the file went with `src/models/mobile/`
itself. Everything else the Slice owned — `AssignedFinished`, `AssignedOrder`,
`AssignedOrderMaterial`, `TimeSheet`, `Trip`, `TripAvailability` and the eight
company models the engineer-event screens carried (`EngineerEvent`,
`EngineerEventType`) — is deleted with the legacy screens.

No model, Shim or other Slice's internals are imported from inside this folder.
The order the attach-order modal creates goes out through the generated
`orderOrderCreate`, and the one thing it borrows from a sibling folder is
`hours/hours-fields`'s duration formatter, which `EngineerEventList` needs for
its "last event duration" column — the Slice's own copy of the function
`componentMixin` used to (wrongly) provide.

## Manual browser checklist

Walk these against a development tenant after any cross-cutting change; they are
the paths a spec cannot judge.

- **Dispatch** (`/mobile/dispatch`): the board opens on this week; day/week
  arrows move it and the grid follows; `Compact`/`Wide` and `All`/`Active`
  survive a reload (localStorage); Search opens the order picker, three
  characters search, picking stages an order and the footer button reads
  "Assign these orders"; assigning paints the orders on the picked users'
  rows; clicking an order box opens the actions modal, and Info/Edit open the
  order; Change date saves both dates *and both times*; Split sends one assigned
  order per picked engineer; Remove takes the order off the board. A planning
  change made elsewhere (the engineer's app) raises the alert icon on Refresh.
- **Engineer map** (`/mobile/map`, maintenance flavour only): pins appear;
  Refresh re-plots them.
- **Assigned finished** (`/mobile/assigned-finished`): the current month loads;
  the arrows move the month *and* the window the endpoint filters on; a row
  opens its order.
- **Timesheets** (`/mobile/timesheet`, `/mobile/timesheet/:user_id`): the week
  grid renders and the arrows move it; a user name opens the detail, whose
  breadcrumb goes back to the same week.
- **Trips** (`/mobile/trips`, `/mobile/trips/form`, `/mobile/trip-availability`,
  `/mobile/trip-availability/:pk`, temps flavour only): the list pages and
  deletes; the form stages orders and saves; availability assigns and unassigns
  a user and the page redraws.
- **Engineer events** (`/company/engineer-users/events`, `…/event-types`): the
  pill row shows both rows for every tenant and marks the screen you are on; a
  row with no order offers "No order, create one", which opens the modal — type
  three characters into its customer search, pick a customer, type a licence
  plate and confirm: an order is created, assigned to the engineer, and the row
  shows "name, city" behind it. An event reported by an engineer's device
  refreshes the list without a reload. The list has no delete and no search; the
  event-type list does both (add, edit, delete and search), and an edit's body
  carries the three fields the form shows.
