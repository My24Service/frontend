# The field-service Slice — the planning console over the mobile workforce

The `/mobile/*` screens: the week board a planner dispatches from, the engineer
map, the assigned-finished list, the timesheets and trips. This directory follows
the Member Slice (`src/features/member/README.md`, the reference implementation)
and the Customer and Equipment Slices: the same rules, the same testing bar.

**These are not the engineer's phone app.** The Flutter application in
`../my24-mobile` owns that surface; `scripts/usage-gate/mobile-callers.json`
shows it calling `assignedorder*`, `assign-me`, `assign-user` and the leave
accept/reject pair. What is here is the console: a route with no
`authLevelNeeded` meta defaults to `AUTH_LEVELS.PLANNING`
(`src/router/mobile.js` carries no meta at all), so every screen in this Slice is
a planning screen.

## Layout

```
index.ts              the one door; src/router/mobile.js mounts what is exported here
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

The largest single finding of this conversion, and the one to fix next. Five
endpoints read query parameters — or answer a body — that
`openapi/schema.yaml` does not declare, and the schema is what the generated
client validates against. Three consequences, in order of severity:

| Endpoint | What the schema misses | Consequence |
|---|---|---|
| `/api/mobile/assignedorder/list_timesheet_totals/` | `start_date`, `user_id` (and `mode`/`year`/`month` read via `get_date_list`, my24service `apps/core/rest.py:834`, `apps/mobile/views.py:534-540`) | Declares **no** query parameter at all, so the generated operation's data type is `query?: never` *and* its `requestValidator` is `query: v.optional(v.never())`, which `beforeRequest` awaits outside its try/catch: the request throws before it is built. Needs the cast **and** `requestValidator: undefined` |
| `/api/inventory/inventory-materials-for-location/` | `location`, `q` | Same two halves; the assigned-order material screen's material picker would throw |
| `/api/mobile/assignedorder/finished_list/` | `month`, `year`, `submodel_id` (`apps/mobile/views.py:251-259`) | The operation declares *other* query parameters, so its validator only tolerates the extras: the cast alone is enough, and the month navigation works |
| `/api/inventory/inventory-locations/` | `q` | The screen no longer sends an empty `q`; a real term still cannot be sent through the client |
| `/api/mobile/trip/{id}/trip_availability_detail/` | The response is a **bundle** `{trip, available_users, assigned_users}` (`apps/mobile/views.py:915+`), declared as `Trip` | The screen types its own view model; a realistic fixture is refused by the seam |
| `/api/order/order/autocomplete/` | Declared `PaginatedOrderAutocompleteList`; the action returns a **bare array** (`OrderViewset.autocomplete`, my24service `apps/order/views/order.py:379+`) | The trip form's type-ahead accepts both shapes, so a corrected schema does not break it |

The permanent fix is on the backend — `@extend_schema(parameters=[...])` on the
three actions, `@extend_schema(responses=...)` on the fourth — followed by
`npm run codegen`. The Slice may not edit `src/api/**` and may not run codegen,
so each call site carries the cast with a comment naming the backend lines, and
the two screens that cannot be exercised through the strict seam say so in their
spec headers:

| Spec | Harness | Why |
|---|---|---|
| `assigned-finished-month.spec.js` | client-shape | `month`/`year` are undeclared, and the seam refuses an undeclared parameter |
| `hours-timesheet.spec.js`, `hours-timesheet-detail.spec.js` | client-shape | `start_date`/`user_id` are undeclared |
| everything else | `installApiSeam` | the strict seam, as the testing bar requires |

`trips-availability-detail.spec.js` is the one spec whose *endpoint* would
justify leaving the seam and does not need to:
`trip_availability_detail` answers a bundle the schema types as a `Trip`, and
the seam's own documentation sanctions an explicit `HttpResponse` for exactly
that — a response the backend does not send, where the fault is the declaration
rather than the fixture. So its requests stay under the strict checks (path,
query, body) and only its response steps around one that is wrong.

`tests/unit/support/api-client-mock.js` gained `getConfig` in this work: the
generated `*QueryKey` factories ask the client for its `baseURL` when they build
a key, which the four verbs alone did not answer. The hours and material specs
had each worked around it locally; the shared fake answers it once now.

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
| TripForm | The order type-ahead's loading state is the search's, not the form's | Typing an order put the whole form under the overlay. The generated response component says `PaginatedOrderAutocompleteList` while the action returns a bare array, so the screen accepts both |
| TripAvailability | A failed load tells the user | Its catch called `errorToast` without importing it, so the legacy screen raised a ReferenceError and showed nothing |
| TripAvailabilityDetail | The assign and unassign go through `useTripAssignment`, and the redraw is that query's invalidation | Same two requests, without a hand-rolled reload |
| Trips lists | Sorting is off and no `ordering` is sent | The legacy headers sorted only the rows already loaded — the endpoints declare no `ordering` parameter, so the sort never reached the wire |
| Trips lists | Page and search live in the URL | The kit's `urlSync`; the legacy read `$route.query.page` alone |

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

`src/models/mobile/Assign.js` is a `TEMPORARY SHIM`, and it is now the only file
left in `src/models/mobile/`. Its one caller is
`src/views/company/EngineerEventOrderForm.vue` — the engineer-event screens, which
are phase 2 of this Slice and which the parent will move in a commit of its own
(`src/router/company.js` is another agent's file today). It derives from the
generated client rather than restating the request, and it names what removes it.
Everything else the Slice owned — `AssignedFinished`, `AssignedOrder`,
`AssignedOrderMaterial`, `TimeSheet`, `Trip`, `TripAvailability` — is deleted
with the legacy screens.

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
