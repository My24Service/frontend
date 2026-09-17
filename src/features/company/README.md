# Company

The company screens: pictures, the activity log, the branches, the budgets,
the partners and the templates, and in later slices the imports and info
screens that `apps/company` serves. Organised by entity, not by screen kind -
`picture/`, `branch/`, `partner/` and so on - the way every multi-entity
feature in this repo is (`customer/`, `member/`, `user/`, `statuscode/`,
`equipment/`).

```
features/company/
  picture/   PictureList, PictureForm, schemas.ts
  activity/  ActivityList
  branch/    BranchList, BranchView, BranchForm, schemas.ts
  budget/    BudgetList, BudgetView, schemas.ts
  partner/   PartnerList, PartnerRequestsSentList, PartnerRequestsReceivedList,
             PartnerRequestsSentForm, schemas.ts
  template/  TemplateList, TemplateForm, schemas.ts
  invalidation.ts
```

## Where this slice departs from the legacy screens

### Pictures

| Screen | Change | Why |
| --- | --- | --- |
| list | Search rides `q`, and the backend answers it | The legacy screen sent `q` and the endpoint silently ignored it (`search_fields = ()`), so searching reloaded the list unchanged. The viewset now searches `name`; the schema already declared `q`, so the contract is unchanged. |
| list | Name and created sort through `ordering` | The legacy table sorted its loaded page client-side through b-table. The viewset now carries `OrderingMixin` with the allow-list (`name`, `created`) - ordering by the stored file's path is meaningless, so the picture column stays non-sortable. |
| form | The file picker stages through the shared file helpers | The legacy form listened for `@input` on a file input that emits `change` (and `update:modelValue`), so picking a file never registered: no preview appeared and a create posted `picture: null`. The form uses `chosenFile`/`readAsDataUrl` from `@/features/shared/file-helpers` - the member logo field's pattern. Proven against the legacy screen before it was deleted. |
| form | An edit without a new file sends no `picture` key | The legacy form sent the whole record back, whose `picture` is the response URL - which `Base64ImageField` rejects, so renaming a picture without picking a new file answered 400. An absent PATCH key leaves the stored file unchanged. |
| form | A blank file choice never rides as `null` | `vPictureRequest.picture` is `optional(string)`; the parse strips an unpicked file instead of sending a null it would reject. |
| form | The name validates against the create body on both writes | The patch body leaves `name` optional because PATCH accepts a partial body - correctly. This form never submits a partial body, so it requires the name on an edit too (ledger case 2, below). |

### Activity

| Screen | Change | Why |
| --- | --- | --- |
| list | Text and created sort through `ordering` | The legacy table sorted its loaded page client-side. The viewset carries `OrderingMixin` with the allow-list (`text`, `created`) - both of the legacy sortable columns are real columns. |
| list | The empty icons column is gone | It rendered empty cells and carried no action; the port is a read-only list with no row actions at all. |

### Branches

The list and form are migrated; the detail follows. So far:

| Screen | Change | Why |
| --- | --- | --- |
| list | The identity column sorts by `name` | The cell shows "name, city, country" but the only sortable term behind it is the name it leads with. |
| list | All six data columns sort through `ordering` | The legacy table sorted its loaded page client-side. The viewset carries `OrderingMixin` with the allow-list (`name`, `contact`, `tel`, `address`, `country_code`, `city`); the icons column stays non-sortable. |
| list | The `country_code` cell keeps its `Postal` header | The legacy screen's own mix-up - the column shows the country code, never the postal code. Kept as it renders; fix the header when the product says so. |
| form | Both writes validate against the create body | The patch bodies (planning and `branch-my`) leave the four identity fields optional because PATCH accepts a partial body - correctly. This form never submits a partial body (ledger case 2). |
| form | The image stages through the shared file helpers | The legacy handler read the files off the event itself (`event.files[0]`), which a native change event does not carry, so picking a branch image crashed the handler and staged nothing. |
| form | An edit without a new file sends no `image` key | The legacy screen already deleted the key in that case; the parse keeps it that way. An absent PATCH key leaves the stored file unchanged. |
| form | Blank optionals ride as absent keys | The parse drops nulls and empty strings the request schemas do not declare; an absent key leaves the stored value unchanged, the same outcome a null had. |
| form | The my-branch variant runs the same kit on a second config | A branch employee's `form/my` has no `:pk` but always edits their own branch through the pathless `branch-my` endpoints. The kit's update hands every write `{path, body}`; the config strips the path the endpoint does not declare, and the save stays on the form. |

### Branch detail

| Screen | Change | Why |
| --- | --- | --- |
| view | The reads fire as parallel queries, not one sequence | Same request set (record, orders, four stats, equipment, locations); only the ordering guarantee is gone. The legacy screen awaited them one by one. |
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

## Preserved as-is

### Pictures

- The thumbnail links to the edit route: pictures have no separate view screen, the edit form is what a row opens.
- A picture without a file shows `NO_IMAGE_URL`.
- The delete modal keeps its id (`delete-picture-modal`) and its copy, and every toast keeps the legacy wording.

### Activity

- The created cell keeps its `<small>` rendering.
- The empty icons column is gone: it rendered empty cells and carried no action. The shared `ServerTable`'s delete confirmation is now optional for the same reason - read-only lists pass none.

## Contract facts worth keeping

### Pictures

- `/api/company/picture/` is full CRUD plus `q` (searching `name`) and
  `ordering` (the allow-list: `name`, `created`, each with its `-` twin),
  paged at 20. `IsPlanningUser`.
- A picture's **request** `picture` is base64 (data URI or bare payload); its **response** `picture` is the stored file's URL. The form keys "already on the server" on that difference: the record's URL never enters the values, only the current-image display.
- `Picture.created` is a display string in the tenant's date format, not an ISO value; the list renders it as-is.

### Activity

- `/api/company/activity/` is a read-only list plus `q` (searching `text`,
  which the viewset already declared) and `ordering` (the allow-list: `text`,
  `created`, each with its `-` twin), paged at 20. `IsPlanningUser`.

### Branches

- `/api/company/branch/` is full CRUD plus `q` (searching
  `name`/`address`/`city`/`email`, which the viewset already declared) and
  `ordering` (the allow-list: `name`, `contact`, `tel`, `address`,
  `country_code`, `city`, each with its `-` twin), paged at 20.
  `IsPlanningUser`.
- The branch form's third write is `PATCH /api/company/branch-my/` for the
  branch employee's own branch - see the form slice.
- The branch detail's orders block reads the plain order list with `branch`.
  The endpoint filtered on it at runtime but never declared it; it is now a
  `NumberFilter(exact)` on the order filterset, so sixteen list-shaped order
  actions advertise the parameter. Nothing else sends it there today.
- `src/models/company/Branch.js` survives as a `TEMPORARY SHIM` for
  `views/dashboard/dashboard_view/dashboardMixin.js` (dashboard Slice), which
  reads `getMyBranch()`/`first()`. Delete it when that caller moves.
- `src/models/equipment/{equipment.js,location.js}` died with this slice's
  detail page, their last caller; the equipment README's shim table is updated
  to match. Only `Document.js` still waits on the dashboard.

### Budgets

- `/api/company/budget/` is full CRUD plus `q` (searching `year`, which the
  viewset already declared), paged at 20. No `ordering` - the legacy table
  offered no sorting. `IsPlanningUser`.
- The `amount` rides the wire as the decimal string the request schema
  declares; the screens convert through `PriceInput`/`toDinero` at the edges.
  There is no request field for the currency.
- `costs/` and `expected_costs/` answer hand-built aggregation dicts
  (`BudgetCostsResponse`, `BudgetExpectedCostsResponse`); the detail page
  renders their totals and per-key breakdowns as-is.

### Partners

- `/api/company/partner/` is a read-only list (its create raises) plus `q`
  (searching the customer and member names) and `ordering` (the allow-list:
  `partner__name`, `created`, each with its `-` twin), paged at 20.
  `IsPlanningUser`.
- `/api/company/partner-request/sent|received/` answer the tenant's own rows
  plus `q` (searching `status` and both member names) and `ordering` (the
  allow-list: `status`, `created`, `from_member__name`, `to_member__name`,
  each with its `-` twin), paged at 20. `accept`/`reject` are bodiless PATCH
  actions answering `{success}`.
- The member picker reads `member/.../get_for_partner_select/` narrowed
  server-side per keystroke - the one generated call the legacy screen
  already made.
- The pills switch between the three screens by route name; no new names were
  needed.

### Templates

- `/api/company/template/` is full CRUD plus `q` (searching `name` and the
  stored filename, which the viewset already declared) and a `name` column
  filter the UI does not use. No `ordering` - the legacy table offered no
  sorting. `IsPlanningUser`.
- The `file` rides the wire as base64 (data URI or bare payload); the record
  never enters the form's values, only the download link. `.docx` only, both
  sides.
- `preview_template_pdf/` takes `{id, uuid, template_type}` and answers the
  PDF as a blob, opened in a new tab - the invoice slice's PDF-viewer pattern.
- The preview picker searches the invoices or quotations of the record's own
  type. The invoice autocomplete read `q` at runtime without declaring it;
  it now declares it (plus a real row component - the schema claimed a
  single invoice while the endpoint answers an array of rows).
- The routes keep their legacy `customer-template-*` names: URLs stay
  stable, so only the components move.
- `src/models/invoices/Invoice.js` died with the form, its last consumer.

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

## Not in this slice

`views/company/` holds more than the company domain, and only what
`apps/company` serves moves here. The rest keeps its legacy screens until its
own slice exists:

| Screens | Future home | Why not here |
| --- | --- | --- |
| `time-registration/` (leave, sick leave, timesheets, 9 files) | `features/workforce/` | Served by `apps/workforce` since block D split it out of company |
| engineer events and event types, `EngineerEventOrderForm`, `PillsEngineer` | user-domain follow-up | Their backend code moved to `apps/user`; `features/user/` is protected. Note: both screens branch on `companycode === 'grm'`, which the flavour rule forbids - fix at migration time. |
| `Dashboard.vue` | dashboard slice (step 6) | Reads `/member/member/` endpoints |
| `TeamleaderSettings`, `TeamleaderCallback`, `teamleader/` choosers, `ConnectorGrippSettings` | deferred | Unfinished integrations; screens and endpoints stay as they are |
| partner screens | `features/company/partner/` (this slice, later) | Served by `apps/company`; the partner-flow prohibition covers three backend files no screen migration touches |

## Test notes

The strict API seam rejects any request or response the generated schema does
not describe, so a fixture is built from the generated component
(`fixtureFor(vPicture, {...})` - `picture` must be a real URL or absent) and a
responder is registered for every endpoint a screen touches.

`tests/unit/router/company-route-names.spec.js` is the equipment slice's
route-name guard adapted to this slice: it imports the company and settings
routers (which evaluates them, so an unimported constant throws there),
collects every registered name, and asserts the set of names the screens can
emit is inside it. Extended with every prefix this slice migrates - the
dual-mounted screens (branches, imports) emit one name family per mount.
