# Workforce

The workforce screens: the time-registration window (the hours people
registered, over a week, a month or a year, and the planner's correction on a
row), leave (the list, the request form, the requests waiting on a planner and
the leave types) and sick leave (the list, the form and the unconfirmed queue).
Organised by entity, not by screen kind - `hours/`, `leave/`, `sick-leave/` -
the way every multi-entity feature in this repo is.

The backend app is `apps/workforce` and the API prefix is `/api/company/*`
(the split is recent: these endpoints were `apps/company` until block D). This
slice mirrors that split, as the human asked; the endpoint paths still carry
`company`.

```
features/workforce/
  SubNav.vue          the pills all six screens mount
  use-user-search.ts  the tenant-wide people picker both forms carry
  index.ts            the one door; the router mounts what is exported here
  hours/              TimeRegistration, pivot.ts, schemas.ts, time-window.ts,
                      invalidation.ts, index.ts
  leave/              LeaveList, LeaveForm, LeaveRequestsList, LeaveTypes,
                      schemas.ts, invalidation.ts, index.ts
  sick-leave/         SickLeaveList, SickLeaveForm, UnconfirmedSickLeaveList,
                      schemas.ts, invalidation.ts, index.ts
```

## Every sub-folder is a feature in waiting

Same rule as `features/company/`: each sub-folder is laid out as if it were
already a top-level feature - its own `schemas.ts`, its own `invalidation.ts`
holding only its own query keys, its own `index.ts` barrel - and **a sub-folder
never imports from a sibling sub-folder**. When `apps/workforce` splits again,
its sub-folder moves to `features/<entity>/` as-is.

That rule is why the two things more than one sub-folder needs live at this
level rather than in either one:

- `SubNav.vue` - the pills are this Slice's chrome, not any one entity's.
- `use-user-search.ts` - the "type to search a user" picker the leave form and
  the sick-leave form both carry. `/api/company/user-list/` is tenant-wide, and
  `features/user/` is another slice's to change; when that slice exports a
  picker of its own, this file moves there.

There is deliberately no `invalidation.ts` at this level: no key is written by
one sub-folder and read by another. `hours/` invalidates the time-registration
window, `leave/` the two leave lists and the leave-type list, `sick-leave/` the
two sick-leave lists.

## The rules this Slice follows

The five rules of the reference implementation (`features/member/README.md`):
one door and it locks behind you, no Shim survives inside the folder, reads go
through the generated query options and writes through the generated mutations,
validation comes from the generated request schema and stays there, and every
spec that touches the network runs through the strict API seam.

### The one direct operation, and why

`leave/LeaveForm.vue` calls `companyUserLeaveHoursAdminGetTotalsCreate` from
`@/api/sdk.gen` rather than through a query: it is a **POST probe**, and a
request whose answer is a preview of *unsaved* form state has no query key to
cache a POST under, so it would be a query option pretending to be one. The
member slice's company-code probe and the user slice's username probe are the
two precedents; this is the third, and the only one here.

Everything else reads through the generated query options and writes through
the generated mutations.

### The list kit

The four lists run on the table kit's door (`@/features/table`): header,
search, pagination and delete confirmation all come from `ServerTable`, and
every one of them passes `urlSync`, so the page and the search term live in the
address and a reload restores the view. None of the four backends declares
`ordering`, so `enableSorting: false` and no column offers a control nothing
honours.

The time-registration pivot is **not** a kit list: the endpoint answers a
hand-built dict (below), and the screen draws fixed columns from it.

### The whole-collection bound

One read asks for the whole collection rather than the API's first page: the
leave form's leave-type picker, `page_size=1000`. 1000 is the API's own ceiling
(`My24Pagination.max_page_size`, my24service `source/apps/core/rest.py`; the DRF
paginator clamps a larger value down to it rather than rejecting the request).
A dropdown cannot page, and a tenant past 20 leave types lost choices from it.
The bound and its citations are worked through in
`src/features/customer/README.md`, "The whole-collection bound".

## Declared exceptions - the ledger

Behaviour the Slice deliberately changed, collected so a reviewer can tell an
intended fix from a refactor bug. URLs moved nowhere: the specs assert the
routes verbatim.

| Screen(s) | Exception | Why |
|---|---|---|
| Sub-nav (all six) | The pills render for every tenant | The legacy `hasNav` computed hid them by reading the company code (`['demo','viavandelen'].indexOf(...)`, which returned a number and was truthy for every tenant but one). Nothing branches on a company code (AGENTS.md: family is `profile.family`, flavour `profile.flavour`), and the pills are this Slice's navigation, not a per-tenant product decision |
| All four lists | The page and the search term live in the URL | The kit's `urlSync`. The legacy `Pagination` wrote the page (and the search term, through `getQueryArgs`) into the address on every page change; this is that intent, expressible and reloadable |
| All four lists | An empty list shows the kit's empty state | The kit renders one row of copy where the legacy table rendered no rows |
| All four lists | The list read carries `page_size=20` | The kit sends the API's own default explicitly; the legacy `BaseModel.list` sent the page alone |
| All four lists | Search is the kit's inline field, not the legacy modal | Same `q` on the wire; the modal's field had no id of its own and its label pointed at nothing |
| Leave list, requests | Search rides `q`, and the backend answers it | The endpoint declares `q` over the user's username and names |
| Leave list, requests | The user column links to `leave-edit` where the legacy cell did | Unchanged behaviour, but pinned by a spec now |
| Leave requests | The accept/reject actions declare no body | The generated operations take none; the legacy model sent `{}` through a CSRF handshake of its own. Same stored outcome |
| Leave requests | The dead `delete-statuscode-modal` is gone | A third modal asking about a statuscode that no row could open |
| Leave types | A save closes the modal and refetches the list | REGRESSION. The legacy handler called `this.$bvModal.hide(...)` from its `$nextTick` callback; `$bvModal` is a bootstrap-vue 2 global nothing in this application installs (those two call sites were its only readers), so the throw skipped both the hide and the reload that followed it. The modal is a template ref and the write invalidates the list query |
| Leave types | An edit body drops `id` (and `created`/`modified`) | The parse output is the body |
| Leave form | The leave-type picker asks for the whole collection | Above |
| Leave form | The totals probe sends the window the endpoint validates, and re-probes when the leave type changes | REGRESSION. The legacy probe posted the whole form object, whose unpicked `leave_type` was `''` where the no-planning body declares a number - a body its own schema rejects, so the probe 400ed on mount and never re-ran when a leave type was finally picked. The endpoint overwrites `user` with the requesting user, so the picker's value has no business on that request either |
| Leave form | The edit read parses `start_date_iso`, not the display string | The legacy read parsed the tenant-formatted `start_date` against a hard-coded "DD/MM/YYYY" - right only for the tenants whose `date_format` setting is that |
| Leave form | The loaded times read "09:00", not "9:0" | REGRESSION. The legacy edit read built the time from the record's hours and minutes unpadded, and the HH:mm rule then refused it, so an untouched edit could not be submitted at all |
| Leave form | Minutes normalise in both time forms | `0:90` reached the endpoint as `0:90`, which Django's duration parser refuses |
| Leave form | A time rides as `start_date_hours`/`start_date_minutes` | The "`HH:mm`" the input shows is not a request field; it is decomposed at the parse. A whole day carries no clock, where the legacy sent the time it happened to hold |
| Leave form, sick-leave form | Bodies carry exactly the request schemas' fields | The parse output is the body: `start_time`, `end_time`, `total_time` and the readonly companions die there |
| Leave form | The two dead time pickers are gone | `<b-form-timepicker>` is a bootstrap-vue 2 component that does not exist here: it rendered nothing and was bound to nothing. The text input is the whole control |
| Leave form | The duplicated `total_time` id is gone | The legacy user field and the totals box shared one id, so the label and any selector reached the wrong input. The user field is `user_name`; the totals box keeps `total_time`. The label-for typo (`totla_time`) is fixed |
| Sick leave list | Delete confirms, sends the row id and refetches | REGRESSION. The legacy `showDeleteModal()` read a bare `id` it was never passed - the template handed the row id to a method that declared no parameter - so the click threw before the modal opened and no sick leave could be deleted at all |
| Sick leave list, unconfirmed list | The user cell is plain text | The legacy `cell(full_name)` template was dead on both: the column's field is `user_full_name`, so the cell never rendered and the name was never the link to `leave-edit` it appeared to be. The row's edit action is the sick-leave editor |
| Sick-leave form | The record's display date is read through a candidate list | That serializer has no ISO twin of `start_date` - it rewrites it into the tenant's `date_format` - so the only machine-readable value is the display string. The legacy parsed it as "DD/MM/YYYY" only. **A `start_date_iso` twin on `UserSickLeaveSerializer` retires this** |
| Sick-leave form | The confirmation posts no body | As the leave requests above |
| Time registration | One screen, not a wrapper and a child | The wrapper's whole job was to fetch and push the answer into a 900-line child through an exposed `processData`. The read is the screen's now, and the payload-to-rows transforms are `pivot.ts` |
| Time registration | The window read sends no `page` | The endpoint ignores it: its `list()` answers a hand-built dict with no envelope, so the page the legacy request carried did nothing |
| Time registration | Month navigation sends `start_date`, not `month`+`year` | The backend truncates `start_date` to the first of the month, producing exactly the window the legacy pair did, on a parameter the schema declares. `month` and `year` are not declared at all |
| Time registration | The year window sends `?year=`, a parameter `openapi/schema.yaml` does not declare | **The one place this Slice reaches past the generated query type.** The backend reads `?year=` for `mode=year` (`UserHoursDataMixin.get_date_list`: "Honoured for week and month, ignored for year", my24service `source/apps/core/rest.py`) while `TimeRegistrationListView`'s `@extend_schema` documents only `mode`, `start_date` and `user`. Dropping it would pin the year pill to the current year while the heading promises the browsed one, so `hours/time-window.ts` adds it through one widening with this note beside it. **The backend declaring the parameter and `npm run codegen` retires the cast** - and until it does, no spec can cover the year window, because the seam correctly refuses the request the screen has to make |
| Time registration | The correction is parsed from what the input holds | REGRESSION. The legacy input carried `@xxchange` and `@update`, neither of which `BFormInput` emits: the preview under it stayed empty and the value sent was the one the modal opened with |
| Time registration | An untouched correction sends nothing | REGRESSION. The guard compared the re-parsed correction against the stored one as strings, and the stored "00:00" re-parses to "0:00", so they never matched and confirming wrote a correction |
| Time registration | Minutes normalise in both time forms | As the leave form |
| Time registration | The correction button reads ± | The legacy spelled "+ / -" out. It is a sign, not copy, and the i18n raw-text rule flags an ASCII "+" on its own |
| Time registration | The three window headers are one block | The legacy repeated sixty lines three times, once per mode, differing only in two format strings and two labels |
| Time registration | The leave table has its own id | The legacy page carried `id="workhours-table"` twice |
| Time registration | The window pills are `$trans` literals | The legacy labels were hard-coded English ("Per week") in an otherwise translated screen |

## Contract facts worth keeping

### Time registration

- `GET /api/company/time-registration/` takes `mode` (week/month/year),
  `start_date`, `user` and the pagination pair, and answers a **hand-built
  dict**: `{full_name, totals_fields, date_list, intervals, totals}`, plus
  `workhour_data` and `leave_data` on a user window. It does not answer the
  paginated envelope `openapi/schema.yaml` declares for it
  (`PaginatedTimeRegistrationListList`, derived from the viewset's
  `serializer_class`): the view overrides `list()` and returns the dict. The
  seam cannot validate a fixture the backend really sends, so the two
  time-registration specs stub it with an explicit `HttpResponse`.
  **`@extend_schema(responses=...)` on that view would make the schema honest.**
- `PATCH /api/company/time-registration/time-correction/{id}/` takes
  `{source, work_correction, work_correction_by_user, notify_engineer}` and
  answers `{result}`. `work_correction` is a duration string; the screen's
  "minutes or hh:mm" is read into one.
- The workhours table's `work_correction` comparison in the cell (`!== '00:00'`)
  is the backend's own spelling, kept as it renders.

### Leave

- `/api/company/user-leave-hours/admin/` is the planning viewset: full CRUD,
  `q` over the user, paged at 20. `/api/company/user-leave-hours/` is the
  no-planning twin a user reaches their own leave through - no screen here
  mounts it.
- `admin/all_not_accepted/` answers `is_accepted=False AND is_rejected=False`;
  the no-planning twin answers `is_accepted=False` alone.
- `admin/{id}/set_accepted|set_rejected/` take no body and answer `{result}`.
- `admin/get_totals/` is validated with the **no-planning** body on both routes
  (the planning-only writable fields play no part in totals) and overwrites
  `user` with the requesting user.
- The response carries `start_date_iso`/`end_date_iso` beside the
  tenant-formatted pair; the form reads the ISO twins.
- `/api/company/leave-type/` is full CRUD plus `q`, paged at 20, no
  `ordering`. `list_for_select/` is a different endpoint with a side effect -
  it **creates** the default types when the tenant has none - which is why the
  form's picker reads the plain list, as the legacy screen did.

### Sick leave

- `/api/company/user-sick-leave/admin/` is the planning viewset, paged at 20,
  with `user` as a filter and `q` over the username. `admin/all_unconfirmed/`
  is the queue this Slice's confirmation screen shows; `admin/all_sick/` is the
  same rows seen from the other side.
- `admin/{id}/set_confirmed/` and `admin/{id}/end_sick/` take no body. The
  `end_sick` action has no screen here - closing a sick leave is not on this
  Slice's screens yet.
- The response has **no ISO twin** of `start_date`; see the ledger row.

### The people picker

- `GET /api/company/user-list/?q=` answers a bare array of
  `{id, name, email, submodel_id}` (not a page), matching `q` case-insensitively
  against the username and both names. `user_type` narrows it to one submodel.

## Not in this slice

| Screens | Future home | Why not here |
| --- | --- | --- |
| `views/mobile/{TimeSheet,TimeSheetDetail,UserHoursData,UserHoursDataDetail,TimeInput}.vue`, `useUserHoursPivot.ts` | field-service slice | They read `/api/mobile/assignedorder/list_timesheet_totals/` (assigned orders), which is the mobile API - not the same thing as this Slice's time registration, which reads `/api/company/time-registration/*`. Migrated separately, at the same time as this slice |
| `views/company/EngineerEvent*.vue`, `PillsEngineer.vue`, the teamleader and Gripp screens | user-domain follow-up / deferred | Their backend code moved to `apps/user`; the teamleader and Gripp integrations are unfinished |
| the statuscode slice's `leave_hours`/`sick_leave`/`work_hours` code types | statuscode slice | That slice's own; untouched |

## Manual browser checklist

Against a development tenant, after any cross-cutting change:

1. **Time registration** - the three pills switch the window and the address
   follows; the arrows step it; a user's name opens the detail window for that
   day; the detail shows the day table, the workhours and (when there are any)
   the leave rows.
2. **A correction** - open one from a workhours row, type `-30`, see
   "Subtract 0:30" appear as you type, confirm, and see the row's correction
   change after the table refetches. Open one and confirm without typing: no
   request, no change.
3. **The year window** - step back a year and check the numbers change with the
   heading. This is the one path no spec covers (see the ledger): if the year
   matches the current one, the undeclared `year` parameter has been dropped
   somewhere.
4. **Leave** - add one for another user (the picker searches by name), watch
   the total-time box fill as the dates change, save, and find it in the list.
   Edit one: the times must read `HH:mm` and the dates must not shift a day.
5. **Leave requests** - accept and reject a request and watch it leave the list.
6. **Leave types** - add one, edit it, delete it. The modal must close after a
   save and the list must refresh behind it.
7. **Sick leave** - add one, edit it, and delete it (the delete that used to
   throw). Then confirm one from the unconfirmed queue.

## Test notes

- `tests/unit/features/workforce/` mirrors the feature path; the shared route
  table is `tests/unit/support/workforce-routes.js`.
- The screens whose sub-nav reads the store need a tenant seeded
  (`main: {memberInfo: {companycode: 'acme'}}`): `getMemberCompanycode` is a
  getter that reads `state.memberInfo`, which is null under a fresh testing
  pinia, and it *throws* rather than returning undefined.
- The end-to-end time anchor is computed the way the screen computes it
  (`moment.locale('nl'); moment().weekday(0)`), not frozen: the screen localises
  moment to the tenant language as it sets up, and a frozen literal would pin
  the day the spec was written.
- `b-modal` teleports to `document.body`, so a spec asserting copy *inside* a
  modal reads it off `document.getElementById(...)`, not off the wrapper.
