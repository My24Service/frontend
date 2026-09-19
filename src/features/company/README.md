# Company

The company screens: pictures, the activity log, the branches, the budgets,
the partners, the templates, the imports and the company info. Organised by
entity, not by screen kind - `picture/`, `branch/`, `partner/` and so on -
the way every multi-entity feature in this repo is (`customer/`, `member/`,
`user/`, `statuscode/`, `equipment/`).

```
features/company/
  picture/   PictureList, PictureForm, schemas.ts, invalidation.ts, index.ts
  activity/  ActivityList, index.ts
  branch/    BranchList, BranchView, BranchForm, schemas.ts, invalidation.ts, index.ts
  budget/    BudgetList, BudgetView, schemas.ts, invalidation.ts, index.ts
  partner/   PartnerList, PartnerRequestsSentList, PartnerRequestsReceivedList,
             PartnerRequestsSentForm, schemas.ts, invalidation.ts, index.ts
  template/  TemplateList, TemplateForm, schemas.ts, invalidation.ts, index.ts
  import/    ImportList, ImportForm, ImportPreview, schemas.ts, invalidation.ts, index.ts
  info/      CompanyInfo, schemas.ts, index.ts
```

## Every sub-folder is a feature in waiting

The entities here share nothing but the backend app they are served from, and
the backend is splitting `apps/company` into smaller apps. So each sub-folder
is laid out as if it were already a top-level feature: its own `schemas.ts`,
its own `invalidation.ts` holding only its own query keys, and its own
`index.ts` barrel that the router imports from
(`import { BranchList } from '@/features/company/branch'`). There is no
`company/index.ts` and no file at this level that the sub-folders share.

The rule that keeps this true: **a sub-folder never imports from a sibling
sub-folder.** If two of them come to need the same thing, that thing belongs
in `features/shared/` (or in the feature that owns it), not at
`features/company/`. When an entity moves to its own backend app, its
sub-folder moves to `features/<entity>/` as-is.

## Entity folders or screen folders

Split by entity while there is more than one entity to split by; split by
screen kind only once there is not. `company/`, `customer/`, `member/`,
`user/`, `statuscode/` and `equipment/` have several entities, so their
sub-folders are entities. `invoice/` has one entity and five screen kinds
(`list/`, `form/`, `detail/`, `pdf/`, `email/`), so its sub-folders are
screens. `order/` is the hybrid: the main entity in `order/`, its form in
`form/`, and the genuinely separate entities (`temps/`, `workorder/`,
`schedule/`, `stats/`) beside it. A single-entity sub-folder inside an
entity-organised feature (`company/branch/`) stays flat until it is large
enough to want screen folders of its own.

The slice name follows the contract rather than the entities inside it: the
backend app is `apps/company`, the API prefix is `/api/company/*`, and the
tenant module key is `company`. Only what that app serves lives here - see
"Not in this slice" for what `views/company/` still holds and why.

## Where this slice departs from the legacy screens

Every table below is a deliberate change, collected so a reviewer can tell an
intended fix from a refactor bug. URLs moved nowhere: the specs assert the
routes verbatim, and the template and import screens keep their legacy route
names.

### Pictures

| Screen | Change | Why |
| --- | --- | --- |
| list | Search rides `q`, and the backend answers it | The legacy screen sent `q` and the endpoint silently ignored it (`search_fields = ()`), so searching reloaded the list unchanged. The viewset now searches `name`; the schema already declared `q`. |
| list | Name and created sort through `ordering` | The legacy table sorted its loaded page client-side through b-table. The viewset now carries `OrderingMixin` with the allow-list (`name`, `created`) - ordering by the stored file's path is meaningless, so the picture column stays non-sortable. |
| form | The file picker is the shared `ImageUploadField` | The legacy form listened for `@input` on a file input that emits `change` (and `update:modelValue`), so picking a file never registered: no preview appeared and a create posted `picture: null`. Proven against the legacy screen before it was deleted. |
| form | An edit without a new file sends no `picture` key | The legacy form sent the whole record back, whose `picture` is the response URL - which `Base64ImageField` rejects, so renaming a picture without picking a new file answered 400. An absent PATCH key leaves the stored file unchanged. |
| form | A blank file choice never rides as `null` | `vPictureRequest.picture` is `optional(string)`; the parse strips an unpicked file instead of sending a null it would reject. |
| form | The name validates against the create body on both writes | The form saves a whole picture, and the create body is the component that says what one needs; the body it PATCHes is a superset of what PATCH requires. Schema selection, not a rule of the form's own. |

### Activity

| Screen | Change | Why |
| --- | --- | --- |
| list | Text and created sort through `ordering` | The legacy table sorted its loaded page client-side. The viewset carries `OrderingMixin` with the allow-list (`text`, `created`) - both of the legacy sortable columns are real columns. |
| list | The empty icons column is gone | It rendered empty cells and carried no action; the port is a read-only list with no row actions at all. `ServerTable`'s delete confirmation became optional for the same reason - read-only lists pass none. |

### Branches

| Screen | Change | Why |
| --- | --- | --- |
| list | The identity column sorts by `name` | The cell shows "name, city, country" but the only sortable term behind it is the name it leads with. |
| list | All six data columns sort through `ordering` | The legacy table sorted its loaded page client-side. The viewset carries `OrderingMixin` with the allow-list (`name`, `contact`, `tel`, `address`, `country_code`, `city`); the icons column stays non-sortable. |
| list | The `country_code` cell keeps its `Postal` header | The legacy screen's own mix-up - the column shows the country code, never the postal code. Kept as it renders; fix the header when the product says so. |
| form | Both writes validate against the create body | The form saves a whole branch, and the create body is the component that says what one needs; the body it PATCHes (planning and `branch-my`) is a superset of what PATCH requires. Schema selection, not a rule of the form's own. |
| form | The image picker is the shared `ImageUploadField` | The legacy handler read the files off the event itself (`event.files[0]`), which a native change event does not carry, so picking a branch image crashed the handler and staged nothing. |
| form | An edit without a new file sends no `image` key | The legacy screen already deleted the key in that case; the parse keeps it that way. |
| form | Blank optionals ride as absent keys | The parse drops nulls and empty strings the request schemas do not declare; an absent key leaves the stored value unchanged, the same outcome a null had. |
| form | The my-branch variant runs the same kit on a second config | A branch employee's `form/my` has no `:pk` but always edits their own branch through the pathless `branch-my` endpoints. The kit's update hands every write `{path, body}`; the config strips the path the endpoint does not declare, and the save stays on the form. |
| view | The reads fire as parallel queries, not one sequence | Same request set (record, orders, four stats, equipment, locations); only the ordering guarantee is gone. |
| view | One subject id for the record, stats and tables; the orders block follows the route pk | The legacy screen mixed two ids on the employee mount. Planning reads everything by the route pk; an employee reads their own record, stats and tables, while the orders block narrows to the route pk when the page has one and reads unfiltered on the dashboard - exactly the calls the legacy screen made, and the server pins the employee's scope itself. |
| view | The equipment and location reads carry `page: 1` | The tables have no pagination UI; the legacy model sent its default page on every list read, so the port sends the same. |
| view | The overlay covers the record read, not the tab reads | The legacy overlay blanked the page for the whole sequential load; the tab tables show their own busy state while they refetch. |

### Budgets

| Screen | Change | Why |
| --- | --- | --- |
| list | Search rides `q`, and the backend answers it | The legacy search handler called `this.model`, which does not exist - opening the search modal crashed the submit. The kit search sends `q`, which the viewset declares (`search_fields = ('year',)`). |
| list | The modal validates before it writes | The legacy modal sent whatever was typed: clearing the amount answered 400 on the decimal regex. An empty year or amount blocks the submit with a message instead. |
| list | A failed save keeps the modal open | The legacy modal closed on OK whatever happened, so a failed save looked like a success - the equipment list's add-state modal fixed the same defect the same way. |
| list | The add button is `btn-primary` | The legacy class was `btn primary`, which styles nothing; every sibling list's add button is `btn-primary`. |
| list | Bodies carry exactly the write schemas' fields | The parse drops the `amount_currency` the legacy model sent along; no request field exists for it. |
| view | The three reads fire as parallel queries, not one sequence | Same request set (record, costs, expected costs); only the ordering guarantee is gone. |
| view | A failed read tells the user | The legacy loader had no catch on any of the three reads: one failure left the spinner up forever. |
| view | Breakdown slices color per label | The legacy memo keyed every partner slice of a pie on one fixed string, so slices that must differ shared a color. The bars on the same screen already color per label. |
| view | The commented-out pies are gone | Dead code the legacy screen carried beside the live charts. |

### Partners

| Screen | Change | Why |
| --- | --- | --- |
| lists | Search rides `q`, and the request backend answers it | The request screens sent `q` the endpoint ignored (`search_fields = ()`). The viewset now searches `status` and both member names; the partner list's `q` already searched. |
| lists | Name and date columns sort through `ordering` | The legacy tables sorted their loaded pages client-side. The viewsets carry `OrderingMixin` - the partner name by relation traversal (`partner__name`), the requests by status, date and member name. Unsortable columns stay that way rather than sending parameters nothing honours. |
| received | The reject dialog is titled "Reject?" | The legacy dialog was titled "Accept?" - a copy slip on the reject path. |
| received | A failed load names the received list | The legacy toast blamed the *sent* list. |
| received | Accept and reject go through the generated mutations | The legacy model PATCHed an explicit `{}` with a CSRF handshake; the actions declare no body, so nothing rides. Same stored outcome. |
| form | Bodies carry exactly the create schema's fields | The parse drops everything the create schema does not declare; `from_member` rides null because the entry is required-but-nullable and the endpoint overwrites it with the sending tenant. |

### Templates

| Screen | Change | Why |
| --- | --- | --- |
| list | The dead `setTemplateActive` is gone | Nothing called it; the list has no active-toggle control. |
| form | The file picker stages through the shared file helpers | The legacy form listened for `@input` on an input that emits `change`, so no file was ever staged: creating a template failed validation outright, and an edit silently kept the stored file. |
| form | An edit without a new file sends no `file` key | An absent PATCH key leaves the stored file unchanged. |
| form | The active flag always rides, true or false | The legacy model stripped falsy values, so unchecking active silently kept the stored true. |
| form | Bodies carry exactly the write schemas' fields | The parse drops everything the endpoints do not declare. |
| form | The update toast says Updated, and its failure names updating | The legacy toast titled an update Created and blamed creating on its failure - two copy slips on the edit path. |
| form | The preview picker tracks rows by uuid | Quotation rows carry no id, so the legacy `track-by="id"` tracked nothing there. |
| form | Invoice options label the order name | The autocomplete rows carry the order's name beside the invoice id; the label says which. |

### Imports

| Screen | Change | Why |
| --- | --- | --- |
| list | Search rides `q`, and the backend answers it | The screen sent `q` the endpoint ignored (`search_fields = ()`). The viewset now searches `name`; the schema already declared `q`. |
| list | The revert and import-all confirmations are modals | The legacy screens called the blocking `confirm()`; the modals carry the same copy and toast pairs, and the list refetches behind them. |
| list | The leaked table CSS is scoped back down | The legacy screen's style block missed `scoped` and aligned every table in the app. The rules render identically on this screen and nowhere else now. |
| list | A null result reads as pending | The icons cell called `Object.keys` unguarded, which throws on a null; the schema declares the column required, but old rows predate it. Pending is what the name cell already said. |
| form | Both writes require a name | The write serializer refuses a blank or null name (the column stays nullable for the rows that predate it); both bodies parse the generated components as they are. |
| form | Bodies carry exactly the write schemas' fields | The parse drops the wizard state (mapping, filter, counts) the legacy model sent back verbatim; absent keys leave the stored values unchanged. |
| form | A disallowed pick stages nothing, and an unstaged file blocks the submit | The legacy screen silently ignored the pick and let the backend 400 the missing file; the form says so up front instead. |
| form | A save toasts, then rides to the preview or the list | The legacy screen navigated silently; the toasts are the kit's standard pair. |
| preview | The three reads fire as listed, then the import | Same request set (lookup fields, preview, do); the legacy screen awaited them one by one. |

### Company info

| Screen | Change | Why |
| --- | --- | --- |
| screen | The icons render | The legacy screen used `<b-icon>`, which this codebase has no component for - Vue logged "Failed to resolve component" and rendered nothing. The port uses the repo's `~icons/bi/*` convention, so the bookmark, pencil, save and camera marks appear. |
| screen | The component is `CompanyInfo.vue` | Named `Info.vue` it fails `vue/multi-word-component-names`. The route name (`company-info`) and path (`/company/company/info`) are unchanged. |
| logos | The pickers stage through the shared `useStagedImage`, bound via `v-model` with a watcher | The legacy screen listened for `@input` on a file input that emits `change`, so a picked logo was never staged - the preview never changed and no logo ever rode a save. The camera icon's `showPicker()` path still opens the dialog. The header layout does not fit `ImageUploadField`'s row, so only the staging behaviour is shared. |
| save | Both writes validate the whole record | The legacy screen required ten fields (vuelidate `required` plus `email` and `url`); the generated patch body declares every one non-blank once present, and the shaped body always carries all ten, so the parse refuses a blank with no rule of the form's own. |
| save | Bodies carry exactly the patch schema's fields | The legacy screen sent the loaded record back verbatim; the parse drops the readonly companions DRF ignored anyway. |
| nav | A rename does not refresh the store | The legacy screen did not either, so the nav shows the old name until the next load. Preserved rather than fixed: the store's initial data is block B/C territory. |

## Preserved as-is

Collected so nobody "fixes" these by accident.

- **Pictures** open their edit form from a row; there is no view screen. A picture without a file shows `NO_IMAGE_URL`. The delete modal keeps its id (`delete-picture-modal`) and its copy, and every toast keeps the legacy wording.
- **Activity** renders `created` in a `<small>`.
- **Branches** render the identity cell as "name, city, country" and keep the `Postal` header over the country-code column (above).
- **Budgets** render the amount through `toDinero` and the view keeps the legacy European format (`$1.234,56`), including the expected-costs breakdown dividing equipment replacements by the *actual* costs total rather than the expected one.
- **Partners** keep `partner has been deleted` lowercase and `partner-request-add` as the request form's route name.
- **Templates** keep `customer-template-add`/`-edit` as their route names: URLs are stable, only the components moved.
- **Imports** keep a row's pending/executed split on whether `result_inserts` has keys - an empty result reads as pending.
- **Company info** keeps the camera-icon picker, the fieldset `disabled` as its read-only switch, and the company code as a readonly input that rides no body.

## Contract facts worth keeping

### Pictures

- `/api/company/picture/` is full CRUD plus `q` (searching `name`) and `ordering` (the allow-list: `name`, `created`, each with its `-` twin), paged at 20. `IsPlanningUser`.
- A picture's **request** `picture` is base64 (data URI or bare payload); its **response** `picture` is the stored file's URL. The form keys "already on the server" on that difference.
- `Picture.created` is a display string in the tenant's date format, not an ISO value.

### Activity

- `/api/company/activity/` is a read-only list plus `q` (searching `text`) and `ordering` (`text`, `created`), paged at 20. `IsPlanningUser`.

### Branches

- `/api/company/branch/` is full CRUD plus `q` (searching `name`/`address`/`city`/`email`) and `ordering` (`name`, `contact`, `tel`, `address`, `country_code`, `city`), paged at 20. `IsPlanningUser`.
- The branch form's third write is `PATCH /api/company/branch-my/` for the branch employee's own branch.
- The branch detail's orders block reads the plain order list with `branch`. The endpoint filtered on it at runtime but never declared it; it is now a `NumberFilter(exact)` on the order filterset, so sixteen list-shaped order actions advertise the parameter.
- `src/models/company/Branch.js` survives as a `TEMPORARY SHIM` for `views/dashboard/dashboard_view/dashboardMixin.js` (dashboard Slice), which reads `getMyBranch()`/`first()`. Delete it when that caller moves.
- `src/models/equipment/{equipment.js,location.js}` died with this slice's detail page, their last caller; the equipment README's shim table is updated to match. Only `Document.js` still waits on the dashboard.

### Budgets

- `/api/company/budget/` is full CRUD plus `q` (searching `year`), paged at 20. No `ordering` - the legacy table offered no sorting. `IsPlanningUser`.
- `amount` rides the wire as the decimal string the request schema declares; the screens convert through `PriceInput`/`toDinero` at the edges. There is no request field for the currency.
- `costs/` and `expected_costs/` answer hand-built aggregation dicts (`BudgetCostsResponse`, `BudgetExpectedCostsResponse`).

### Partners

- `/api/company/partner/` is a read-only list (its create raises) plus `q` (searching the customer and member names) and `ordering` (`partner__name`, `created`), paged at 20. `IsPlanningUser`.
- `/api/company/partner-request/sent|received/` answer the tenant's own rows plus `q` (searching `status` and both member names) and `ordering` (`status`, `created`, `from_member__name`, `to_member__name`), paged at 20. `accept`/`reject` are bodiless PATCH actions answering `{success}`.
- The member picker reads `member/.../get_for_partner_select/` narrowed server-side per keystroke - the one generated call the legacy screen already made.
- The partner-flow prohibition (`apps/order/models/order.py:495-598`, `order_line.py`, `apps/statuscode/ttsa_order.py`) is untouched by this slice: the screens talk to the company viewsets, and no backend file outside `apps/company` and `apps/order/filters.py` was edited.

### Templates

- `/api/company/template/` is full CRUD plus `q` (searching `name` and the stored filename) and a `name` column filter the UI does not use. No `ordering` - the legacy table offered no sorting. `IsPlanningUser`.
- The `file` rides the wire as base64; the record never enters the form's values, only the download link. `.docx` only, both sides.
- `preview_template_pdf/` takes `{id, uuid, template_type}` and answers the PDF as a blob, opened in a new tab - the invoice slice's PDF-viewer pattern.
- The preview picker searches the invoices or quotations of the record's own type. The invoice autocomplete read `q` at runtime without declaring it; it now declares it, plus a real `InvoiceAutocomplete` row component (the schema had claimed a single invoice while the endpoint answers an array of rows).
- `src/models/invoices/Invoice.js` died with the form, its last consumer.

### Imports

- `/api/company/import/` is full CRUD plus `q` (searching `name`), paged at 20. No `ordering`. `IsPlanningUser`.
- The `mapping` and `result_inserts` request fields are optional again: the create form cannot supply the wizard's state, and the model defaults cover an absent key. The schema had overstated them as required.
- `preview/` answers one sheet per model kind with the rows the run would write; `do/` answers the same shape after writing it. `get_lookup_fields/` names the dedupe columns per kind; `get_allowed_extensions/` lists what the picker accepts.
- Both mounts emit one route-name family per stem; the screens switch on the stem the routers supply, and `from_settings` plays no role on them.

### Company info

- `GET|PATCH /api/member/member/me/` is the tenant's own record: one read, one write, no pk and no create. The kit runs on it with a truthy pseudo-pk holding its edit path, the branch form's own-branch pattern.
- `companylogo` and `companylogo_workorder` are base64 on the write and URLs on the read, so a staged logo enters the values only when picked.
- The screen does not refresh the store's `memberInfo`, so a rename shows in the nav on the next load. That is the legacy behaviour, not a port choice.
- `src/features/member/member/wire-defaults.ts` supplied the legacy blank record; the port's `emptyInfo()` does the same job inside this slice.

## Not in this slice

`views/company/` holds more than the company domain, and only what
`apps/company` serves moves here. The rest keeps its legacy screens until its
own slice exists:

| Screens | Future home | Why not here |
| --- | --- | --- |
| `time-registration/` (leave, sick leave, timesheets, 9 files) | `features/workforce/` | Served by `apps/workforce` since block D split it out of company. The human confirmed the frontend should mirror that app split, and that building `features/workforce` is not this step's job. |
| engineer events and event types, `EngineerEventOrderForm`, `PillsEngineer` | user-domain follow-up | Their backend code moved to `apps/user`; `features/user/` is protected. Note: both screens branch on `companycode === 'grm'`, which the flavour rule forbids - fix at migration time. |
| `Dashboard.vue` | dashboard slice (step 6) | Reads `/member/member/` endpoints |
| `TeamleaderSettings`, `TeamleaderCallback`, `teamleader/` choosers, `ConnectorGrippSettings` | deferred | Unfinished integrations; screens and endpoints stay as they are |

## Test notes

The strict API seam rejects any request or response the generated schema does
not describe, so a fixture is built from the generated component
(`fixtureFor(vPicture, {...})` - `picture` must be a real URL or absent) and a
responder is registered for every endpoint a screen touches. Three traps cost
time here and are worth knowing before writing a spec:

- **A stats-style endpoint's payload is wrapped in a key named after itself**,
  and the generated response schema already carries the wrapper - so the
  responder is `fixtureFor(vOrderTypesStatsResponse)`, not a hand-built
  `{[key]: …}`. The import preview's `do` action answers the same shape as
  `preview`, so its fixture is `fixtureFor(vImportResult, {...})`.
- **`BFormFile` puts its `id` on the browse *button*, not the input.** A spec
  that needs the input finds it by `input[type="file"]`, and a screen with two
  of them (company info) indexes in DOM order.
- **`fieldset :disabled` is not an attribute on the inputs.** The company info
  screen's read-only switch is asserted on the `fieldset`, not each field.
- **Overriding the kit's `mutationFn` for a pathless endpoint drops the
  generated factory's `throwOnError`** unless it is passed back, and without
  it a failed save reads as a success. The branch form's `branch-my` variant
  and the company info screen both do this; each has a regression test.

`tests/unit/router/company-route-names.spec.js` is the equipment slice's
route-name guard adapted to this slice: it imports the company, settings and
equipment routers (which evaluates them, so an unimported constant throws
there), collects every registered name, and asserts the set of names the
screens can emit is inside it. The dual-mounted screens (branches, imports)
emit one name family per mount, and the template screens keep their
`customer-template-*` names.
