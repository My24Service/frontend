# Company

The company screens: pictures and the activity log, and in later slices the branches, budgets,
partners, templates, imports and info screens that `apps/company`
serves. Organised by entity, not by screen kind - `picture/`, `branch/`,
`partner/` and so on - the way every multi-entity feature in this repo is
(`customer/`, `member/`, `user/`, `statuscode/`, `equipment/`).

```
features/company/
  picture/   PictureList, PictureForm, schemas.ts
  activity/  ActivityList
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
