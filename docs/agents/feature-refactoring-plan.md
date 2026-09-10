# Feature refactoring plan

Combined work order for `src/features/`. It merges two independent reviews of
the same code: `docs/agents/feature-refactoring-followups.md` and
`docs/agents/feature-architecture-review-fixes.md`. Keep both for the evidence
trail; this file is the one to work from.

Read `docs/agents/feature-refactoring-guide.md` before starting. Read
`docs/agents/form-schemas.md` before touching any form, schema, or validation
code. Line references are from the reviews and may have drifted; verify each
one before editing.

## How to use this plan

- Work the phases in order. Units inside a phase are independent unless a unit
  says otherwise. Phase 0 resolves the decisions that would otherwise block
  later units.
- One unit is one commit and ends green. A unit is done only when its
  completion criterion holds and the checks pass.
- Reversible work proceeds without asking. If a unit's premise no longer holds,
  or Phase 0 finds evidence for the opposite call, stop and report rather than
  guessing.
- Every correctness fix ships a regression test that fails before the change
  and passes after. The test lives under `tests/unit/features/`, mirroring the
  feature path. A fix without its failing-then-passing test is not done.

Run after every unit:

```
npm run typecheck
npx eslint src/features
npm test
```

`npm run lint:i18n` when a `.vue` template changed. `npm run build` at the end
of each phase. `npm run lint` does not pass `--fix`, so it reports findings
without rewriting anything and is safe for verification; `npm run lint:fix` is
the one that rewrites files you did not intend to touch.

## Scope at a glance

| Unit | Area | Severity | Effort |
|---|---|---|---|
| 0.1 | Confirm the customer contract field | gate | S |
| 0.2 | Decide `urlSync` | gate | S |
| 0.3 | Recreate or retire `schema-strengthenings.md` | gate | S |
| 0.4 | Decide the refresh reload | gate | S |
| 1.1 | Render `sum_tariffs`, not `contract_value` | High | S |
| 1.2 | Staged-row edit-then-cancel, both panels | High | S |
| 1.3 | One availability probe, race-free | High | M |
| 1.4 | URL restore snaps page to 1 | High | S |
| 1.5 | Username probe query encoding | High | S |
| 1.6 | 401 on bad credentials logs out and reloads | High | S |
| 1.7 | Validate equipment rows before the contract write | High | S |
| 1.8 | Refresh can resurrect a logged-out session | Medium | S |
| 1.9 | `isLoggedIn` treats `undefined` as logged in | Medium | S |
| 1.10 | Remove test-only `defineExpose` | Medium | S |
| 2.1 | Delete the duplicate `SESSION_AUTH_HEADER` | Medium | S |
| 2.2 | Move `dinero-helpers` out of `shared/` | Medium | S |
| 2.3 | Stop the kits importing `@/utils` | Medium | M |
| 2.4 | Route auth-store imports through the door | Medium | S |
| 2.5 | Cut the Customer slice's legacy-model leak | High | M |
| 2.6 | Give the kits doors or amend ADR-0002 | Medium | S |
| 2.7 | Break the `stores/main` ↔ `auth` deep import | Medium | S |
| 2.8 | Move auth-level policy into the auth feature | Medium | S |
| 3.1 | Route the user forms through their schema functions | High | M |
| 3.2 | Remove the index-constraint workarounds | Medium | M |
| 3.3 | Delete dead kit and wrapper configuration | Low | S |
| 3.4 | Make `fieldErrors` nested-aware | Medium | M |
| 3.5 | Hoist the password rules | Medium | S |
| 3.6 | Adopt `ValidatedFormField` | Medium | M |
| 3.7 | Honest write context in `useResourceForm` | Medium | S |
| 4.1 | Port the account specs to the strict seam | Medium | M |
| 4.2 | Wire or drop the orphaned member list goldens | Medium | M |
| 5.1 | Page-1-only option lists and embedded tables | Medium | M |
| 5.2 | Read the `next` query after login | Medium | S |
| 5.3 | Generalize the revoke confirmed-action flow | Medium | M |
| 5.4 | Invalidate the derived member and contract columns | Medium | S |
| 5.5 | Adjust `editingIndex` on row delete | Low | S |
| 5.6 | Encode the export `q` and flush the debounce | Low | S |
| 5.7 | Route query-error toasts through the hook | Low | S |
| 5.8 | Toast only on a successful clipboard write | Low | S |
| 5.9 | Reconcile the add-route gate with the button gate | Medium | S |
| 6.1 | Enable `urlSync` or correct the ledgers | Medium | S |
| 6.2 | Recreate `schema-strengthenings.md` | Medium | S |
| 6.3 | Fix the `form-schemas.md` pointer | Low | S |
| 6.4 | Fix stale comments and README file names | Low | S |
| 6.5 | Sweep the small cleanups | Low | M |
| 7.1 | Extract the staged-equipment panel | Structural | M |
| 7.2 | Decompose `CustomerForm` and `MemberForm` | Structural | M |
| 7.3 | One token source | Structural | M |
| 7.4 | Type the login and refresh boundary | Structural | S |

## Phase 0. Resolve the decisions

### 0.1 Confirm the customer contract field
Read the backend serializer and `openapi/schema.yaml` for the
maintenance-contract response. Unit 1.1 assumes the wire carries `sum_tariffs`
and not `contract_value`. If the backend does send `contract_value`, add it to
`openapi/schema.yaml`, regenerate, and drop unit 1.1. Report which case you
found.

Completion: a written statement of which field the response carries, with the
file and line you read.

### 0.2 Decide `urlSync` for member and user lists
The ledgers say search and page live in the URL
(`src/features/member/README.md:122`, `src/features/user/README.md:96,101,110`),
and the pre-kit member lists used `useRoutePagedList`, which put them there.
Only `CustomerList.vue:212` sets `urlSync: true` today. The evidence says the
behavior was intended and lost in the kit migration. Enable it in unit 6.1. If
`git log` on the promotion commit shows a deliberate removal, report that
instead.

Completion: a written call, backed by the README lines or the commit that
removed the behavior.

### 0.3 Recreate or retire `docs/schema-strengthenings.md`
Four places cite this file and it does not exist: `src/features/member/README.md:81`,
`docs/adr/0003-*.md:96`, `docs/agents/form-schemas.md:136`,
`src/features/customer/customer/schemas.ts:16`. Recreate it in unit 6.2 with
the member strengthenings (`member/schemas.ts:19`, `:137-148`) and any customer
rules, each with why it is permanent. If the content belongs in
`form-schemas.md` step 6 instead, move it there and delete the four references.

Completion: the cited path exists and lists every surviving strengthening with
a reason, or the four references point at the file that now holds the content.

### 0.4 Decide the refresh reload
`auth/store.ts:115` calls `window.location.reload()` after every refresh, and
`tests/unit/features/auth/auth-store.spec.js` pins it. Decide: keep, make
conditional (for example, only when the refresh was user-initiated), or drop it
in favor of updating the token and letting queries retry. Unit 7.3 depends on
the answer; unit 1.8 does not.

Completion: a written call and the spec that will change with it.

## Phase 1. Correctness

### 1.1 Render `sum_tariffs`, not the phantom `contract_value`
Where. `src/features/customer/customer/CustomerView.vue:118` renders
`EUR {{ data.item.contract_value }}`. Line 345 invents
`type ContractRow = MaintenanceContract & {contract_value?: string}` and line
346 casts to it. The generated contract schema has `sum_tariffs` and no
`contract_value` (`src/api/valibot.gen.ts:3686`).

Change. Render `sum_tariffs` through the dinero helpers the way
`MaintenanceContractList.vue:69-92` does. Delete `ContractRow` and the cast.
Update the fixture at `tests/unit/features/customer/customer-view.spec.js:73-74`
to send `sum_tariffs` — the old fixture passed because valibot objects ignore
unknown keys.

Completion. `CustomerView.vue` contains no `contract_value`. The spec asserts
the formatted `sum_tariffs` and fails against the pre-change component.

### 1.2 Staged-row edit-then-cancel, both panels
Where. `MaintenanceContractForm.vue:551-566` sets `rowEdit.value = item`,
aliasing the staged row; `v-model="rowEdit.*"` mutates the row in place, and
`cancelEditEquipment` resets only the ref. `DocumentPanel.vue:291-305` has the
same shape: `editDocument` aliases the row, `cancelEditDocument` clears the
ref, and `chooseReplacement` (`:342-348`) has already written the replacement
file into the committed row.

Change. Copy on edit (`rowEdit.value = {...item}`; `editRow.value =
{...rows.value[index]}`), track the edited index, and write the copy back on
commit (`rows.value[editIndex] = editRow.value`). Clear both refs on
cancel/discard.

Completion. A spec per panel: start an edit, change a field and attach a
replacement file, cancel, assert the staged row is unchanged; then commit and
assert it changed. Both specs fail before the change.

### 1.3 One availability probe, race-free
Where. `member/member/use-company-code-probe.ts:33-63` and
`user/use-username-probe.ts:38-72` share one mutable `settleLatestProbe`. A
keystroke during an in-flight probe reassigns it, and the old response's
`finally` resolves the new promise, so `waitForProbe()` (`MemberForm.vue:520-530`,
`use-user-form.ts:173`) returns while the current value is still `checking` and
the save proceeds unverified. The two files are otherwise the same state
machine with a different predicate, fetch, and debounce.

Change. Extract one `useAvailabilityProbe({read, original, shouldProbe, check,
debounceMs})` into `src/features/forms/`, owning `state`, `pendingProbe`,
`validationState`, `waitForProbe`, and the two watches. Give each probe a
sequence token and settle only the probe whose token is current. Rewrite both
files as thin domain adapters that keep their names, public types, and the
README note about the declared raw-SDK exception. Lift the taken-verdict merge
into the same module (`mergeTakenVerdict(errors, {probe, read, original,
message})`) and use it from both `MemberForm.vue` and `use-user-form.ts`.
Delete `use-company-code-probe.ts`. Fix the import inversion while there:
`use-username-probe.ts:7` imports `USERNAME_PROBE_DEBOUNCE_MS` from
`./sales/schemas`; import it from `./user-form` and delete the
`sales/schemas.ts:54` re-export.

Completion. One implementation of the race/barrier logic exists and both slices
use it. A spec types value A, then value B while A is in flight, resolves A's
response after B starts, and asserts `waitForProbe` does not resolve until B's
response lands. The spec fails against the old code.

### 1.4 Stop URL restore snapping the page back to 1
Where. `src/features/table/server-paged-list.ts:86-104` registers the
`searchDraft` and `columnFilters` debounces before `useUrlQuerySync` at `:126`.
On load, `url-query-sync.ts:42,66` write those draft refs, which arms the
debounces, and 300 ms later `server-paged-list.ts:90,101` reset `pageIndex` to
0. A shared URL carrying `q` and page 2 loads page 2, then refetches page 1.

Change. Let `apply()` set the committed state without arming the user-input
debounce. Add a `hydrating` flag the debounced callbacks check before resetting
the page, or write `globalFilter` and `committedFilters` directly and leave the
drafts alone.

Completion. Extend `tests/unit/features/customer/customer-list.spec.js:329` to
call `pastDebounce()` after restoring the URL and assert no page-1 request
fires. The spec fails before the change.

### 1.5 Encode the username probe query value
Where. `src/features/user/use-username-probe.ts:64` builds
`/company/username-exists/?username=${value}` by concatenation. The generated
username pattern allows `+`, which decodes to a space in a query string, so
`jan+jansen` probes `jan jansen`.

Change. Pass the value through axios `params` or `encodeURIComponent`.

Completion. A spec probes a username containing `+` and asserts the request
carries the literal `+`, not a space. The spec fails before the change.

### 1.6 Treat a 401 as expiry only when the request carried a token
Where. `src/services/auth/clientDriver.ts:13-18` logs out and sets
`document.location.href="/"` on every 401. Login uses the same client
(`src/features/auth/store.ts:3,95`) and SimpleJWT answers bad credentials with
401, so a wrong password reloads the page before `LoginForm.vue:95-98` can show
its error.

Change. Gate the logout branch on the request having carried an `Authorization`
header, for example `error.config?.headers?.Authorization`. Login and refresh
send no such header when logged out (`auth-header.ts:11-18`), so this separates
credential failure from expiry with no endpoint list.

Completion. A spec drives the real interceptor with a 401 on a header-less
login request and asserts no logout and no redirect; the existing expiry case
(`tests/unit/features/auth/session-wiring.spec.js:57-74`) still passes. The new
spec fails before the change.

### 1.7 Validate staged equipment rows before the contract write
Where. `MaintenanceContractForm.vue:432` validates only the contract schema.
`addEquipment` at `:544-549` accepts a bad `times_per_year`, and
`replayEquipmentRows` at `:394-406` throws after the contract POST succeeded,
so a retry creates a duplicate contract.

Change. Map `equipmentRowErrors` over `equipmentRows` inside the form's
`validate` and block submit when any row fails. The save becomes all-or-nothing
before the first request.

Completion. A spec enters a row with a non-numeric `times_per_year`, submits,
and asserts no contract request fires and the row shows its error. The spec
fails before the change.

### 1.8 Keep refresh from resurrecting a logged-out session
Where. `src/features/auth/store.ts:107-116` reads the token, awaits the refresh
call, then unconditionally authenticates and reloads. A logout during that
await still gets overwritten.

Change. After the await, bail when the session changed, for example
`if (getStoredToken() !== token) return`.

Completion. A spec logs out during an in-flight refresh and asserts the token
is not restored. The spec fails before the change.

### 1.9 Normalize `userInfo` so `isLoggedIn` is honest
Where. `src/features/auth/store.ts:58-60` checks `userInfo !== null`.
`setUserInfo` at `:82-84` accepts `null`, but the bootstrap writes
`initialData.userInfo` (`src/stores/main/index.js:212`), which is optional, so
an omitted field arrives as `undefined` and passes the check.

Change. Normalize at the boundary (`this.userInfo = userInfo ?? null`) or use
`!= null` in `isLoggedIn`.

Completion. A spec sets `userInfo` to `undefined` and asserts `isLoggedIn` is
false. The spec fails before the change.

### 1.10 Remove test-only `defineExpose`
Where. `MaintenanceContractForm.vue:667` and `MaintenanceContractView.vue:370`
expose internals solely for `wrapper.vm` access
(`maintenance-contract-form.spec.js:265-290`,
`maintenance-contract-view.spec.js:177`).

Change. Delete both `defineExpose` calls. Rewrite the specs to drive the
quick-create modal through the DOM and reach the store through the testing
pinia, as `tests/unit/support/form-harness.js:252-255` requires. Keep
`table/ListDeleteModal.vue:56` — that one is a real component API.

Completion. No spec reads `wrapper.vm.<internal>` for these components and the
specs pass.

## Phase 2. Boundaries

### 2.1 Delete the duplicate `SESSION_AUTH_HEADER`
Where. `src/features/customer/session-auth-header.ts:1` is a copy of
`src/features/shared/session-auth-header.ts:11`. The shared comment at `:8`
claims a hoist that never finished. Four customer files import the local copy:
`CustomerForm.vue:420`, `CustomerView.vue:285`, `CustomerList.vue:66`,
`MaintenanceContractForm.vue:351`.

Change. Repoint the four imports at `@/features/shared/session-auth-header`,
delete the customer file, and update `src/features/customer/README.md:23,71`.

Completion. The customer file is gone, no import references it, and the tests
stay green.

### 2.2 Move `dinero-helpers` out of `shared/`
Where. `src/features/shared/dinero-helpers.ts:5-14` defines `TariffRow` and
`rowDinero`, maintenance-contract concepts. Its only consumers are
`maintenance-contract/MaintenanceContractForm.vue:350`,
`MaintenanceContractList.vue:52`, `MaintenanceContractView.vue:188`, plus
`tests/unit/features/shared/dinero-helpers.spec.js`. `tryToDinero` has the
same single consumer set.

Change. Move the whole file to
`customer/maintenance-contract/dinero-helpers.ts` and update the three imports
and the spec path. Keep `shared/file-helpers.ts` where it is — its consumers
span customer and member. If a second domain needs `tryToDinero` later, hoist
that one function back to shared.

Completion. `features/shared/` contains no domain concept; the spec directory
matches the move.

### 2.3 Stop the kits importing `@/utils`
Where. The kits import `@/utils` for `$trans`, toasts, and `toDinero`:
`forms/use-resource-form.ts:12`, `forms/use-query-error-toast.ts:3`,
`table/use-list-delete.ts:7`, `table/server-paged-list.ts:13`,
`table/list-columns.ts:5`, and the table components. `src/utils.js:4,10,11`
imports the orders model, the auth store, and the main store, so the leaf layer
evaluates domain modules at load.

Change. Move the pure helpers (`$trans`, `errorToast`, `infoToast`, `toDinero`)
into `src/services/i18n.ts` — infrastructure, not a feature, so it does not
belong in `features/shared/`. Migrate all callers (a scripted find and replace
is appropriate; `utils.js` itself uses `$trans` and `errorToast` internally)
and delete the originals from `utils.js`, so there is one source of truth.

Completion. `grep -rn "from '@/utils'" src/features/{forms,table,shared}`
returns nothing, no duplicate `$trans` exists, and `npm run build` succeeds.

### 2.4 Route auth-store imports through the door
Where. Non-service callers import `@/features/auth/store` directly:
`src/views/orders/OrderFormMaintenanceCustomer.vue:461`,
`src/components/NavItems.vue:182`, `Notification.vue:17`,
`NavItemsSettings.vue:87`, `the_nav/navMixin.js:3`, `TheIndexLayout.vue:11`,
`NavItemsBranch.vue:59`, `TheAppLayout.vue:18`, `src/stores/main/index.js:3`,
`src/utils.js:10`, `src/mixins/common.js:3`. Sibling files `TheIndex.vue:33`
and `TheNavLoggedIn.vue:115` already use the door
(`src/features/auth/index.ts` exports `useAuthStore`).

Change. Repoint these at `@/features/auth`. Leave
`services/auth/auth-header.ts:1` and `clientDriver.ts:15` alone — their
comments document the cycle they avoid. If a caller cannot use the door for a
cycle reason, add the same one-line justification beside it. Trim the barrel to
what consumers actually use; the storage helpers it exports today have no
callers through the door (unit 7.3 deletes them).

Completion. Every direct import of `@/features/auth/store` outside
`src/services/auth` is gone or carries a written cycle reason. Tests and build
stay green.

### 2.5 Cut the Customer slice's legacy-model leak
Where. `CustomerView.vue:281` and the contract screens import
`@/components/CustomerCard.vue`, which imports the Customer Shim at
`CustomerCard.vue:32`. `CustomerView.vue:282` and
`MaintenanceContractView.vue:183` import `OrdersTable.vue`, which imports
`@/models/orders/Status.js`. The Shim comment at `src/models/customer/Customer.js:9-11`
lists its callers and omits `CustomerCard`, so the Shim cannot die when those
callers convert.

Change. Add a slice-local customer card that takes the plain fields the
template reads (`name`, `address`, `city`, `country_code`, `postal`, `contact`,
`email`, `tel`, `mobile`, `customer_id`, `external_identifier`, `remarks`). For
the orders tab, either accept it as a documented cross-slice exception or track
it against the future Orders slice. Update the Shim comment either way.

Completion. The Customer slice no longer reaches the Customer Shim. A test or a
grep check confirms no `@/components/CustomerCard` or
`@/components/OrdersTable` import remains in the slice, or the exception is
written down with its reason.

### 2.6 Give the kits doors or amend ADR-0002
Where. `src/features/forms/`, `src/features/table/`, and `src/features/shared/`
have no `index.ts`, so consumers deep-import, while ADR-0002 rule 1 says the
index is the public surface.

Change. Add an `index.ts` to each kit that exports its public surface, or amend
ADR-0002 to exempt cross-cutting kits and state the deep-import convention.
Pick one and make it uniform.

Completion. Either each kit has a door and the slices import through it, or
ADR-0002 states the exemption in writing.

### 2.7 Break the `stores/main` ↔ `auth` deep import
Where. `src/stores/main/index.js:3` deep-imports `@/features/auth/store`, and
`src/features/auth/store.ts:4` imports `@/stores/main`. The auth README calls
the seam deliberate, but the deep import breaks the door rule.

Change. Import the auth store through `@/features/auth`, or extract a small
session facade both stores depend on. Keep the documented seam order from the
auth README.

Completion. `stores/main` uses the auth door or the facade. Tests stay green.

### 2.8 Move auth-level policy into the auth feature
Where. `src/utils.js:17-96` holds `getUserAuthLevel` and
`hasAccessRouteAuthLevel` plus their `AUTH_LEVELS` mapping. Its only consumer is
`router/index.js:21,68,89`. This is what keeps `utils.js` importing
`useAuthStore` and forces the cycle workarounds elsewhere.

Change. Move both functions into `src/features/auth/auth-levels.ts`; the router
(pages layer) may depend on a domain feature. `utils.js` keeps its
`useAuthStore` import for `hasAccessToModule`, which stays put — it has many
legacy consumers and is a separate concern; note it in the final summary as the
remaining transitional seam.

Completion. `grep -rn 'getUserAuthLevel\|hasAccessRouteAuthLevel' src` shows
the auth feature and the router only.

## Phase 3. Unify and delete

### 3.1 Route the user forms through their schema functions
Where. `src/features/user/use-user-form.ts:122-198` hardcodes validation and
parsing. The per-type `validateXUserForm` and `parseXUserForm` in all seven
`schemas.ts` files are never imported by a component, so their spec suites test
a path production never runs. The wrapper also duck-types the API payload at
`:84-88,128-148` and hardcodes the engineer `preferred_location` rule at
`:159-168`, both duplicated in the schemas.

Change. Give `useUserForm` `validate` and `parse` hooks the way
`useResourceForm` has them, and pass the existing tested schema functions
(`sales/schemas.ts:79,88`; `api/schemas.ts:124,147`; engineer `130,148`;
student `137,146`; and the rest). Fold the API and engineer rules into their
screens' schema functions. Keep the probe barrier and password assembly in the
wrapper. Delete `isApiPayload`, the `schema.entries.api_user` casts, the
generic `preferred_location` check, and any now-unread config fields
(`schema`, `fieldMessages`, `payloadOf`).

Completion. No component imports `useUserForm` without passing its schema
functions; every `validateXUserForm` / `parseXUserForm` has a production
caller; `grep -r isApiPayload src` returns nothing; the seven schema spec
suites exercise the production path; tests and typecheck pass.

### 3.2 Remove the index-constraint workarounds
Where. `UserFormValuesBase` (`use-user-form.ts:17-21`) and
`UserIdentityPanelValues` (`UserIdentityPanel.vue:102-110`) append
`& Record<string, unknown>`. The forms compensate four different ways: the
alias (`SalesUserForm.vue:125` and siblings), `Omit<X, never>`
(`EngineerUserForm.vue:317`, `EmployeeUserForm.vue:134`), an `as`
(`StudentUserForm.vue:347`), and whole-object bridges
(`EngineerUserForm.vue:376-379`, `EmployeeUserForm.vue:220-223`).

Change. Constrain `useUserForm` to the keys it reads (`username`, `password1`,
`password2`). Make `UserIdentityPanel` generic over the values type instead of
using an index signature, and make its message props conditional on
`withPersonal` so `ApiUserForm.vue:149-155`'s `() => ''` stubs go. Delete the
aliases, the `Omit<never>` forms, the `as`, and the bridges.

Completion. No form carries an index-signature alias or an identity bridge.
Typecheck stays green with no new casts.

### 3.3 Delete dead kit and wrapper configuration
Where. `getRowId` (`server-paged-list.ts:63-64`) has a default at `:168`;
verify which lists restate it and drop the restatements. `updateVars`
(`use-resource-form.ts:57`) and `createVars` have no consumer — verify with
grep first. `ColumnMeta.selectOptions` (`table.ts:50`) and the select branch
(`ServerDataTable.vue:44-57,133-135`) have no column. `pageSize`
(`server-paged-list.ts:60-61`) is never set. `use-list-delete.ts:66` returns
`deleteModal`, `deletingPk`, `doDelete`, unused by its only consumer. In
`UseUserFormConfig`, `validateExtra`, `reasonOf`, `onSaved`, `createVars`, and
`updateVars` have no caller among the seven forms.

Change. Delete each option and branch, and the unused exports. Add them back
when a second real consumer appears.

Completion. No caller passes a deleted option; grep confirms each was unused;
list and form tests stay green.

### 3.4 Make `fieldErrors` nested-aware
Where. `forms/validation.ts:42` keys on `issue.path[0].key`. Two workarounds
exist: the api composition (`api/schemas.ts:137-142`) and student's collapse of
every sub-object error to `student_user` (`student/schemas.ts:107`, rendered at
`StudentUserForm.vue:166-172`).

Change. Extend `fieldErrors` so a message can be addressed to a nested path
(for example `{api_user: {name: msg}}`), keying the returned error by the
deepest mapped leaf and falling back to the first path segment. Flat schemas
keep today's behavior exactly. Then `validateApiUserForm` becomes one
`fieldErrors` call, and student returns real leaf keys that its template
renders next to the fields.

Completion. Api and student each call `fieldErrors` once; flat-schema specs are
unchanged; nested specs cover both cases.

### 3.5 Hoist the password rules
Where. `account/schemas.ts:64-75,81-85` duplicates `user-form.ts:63-79,34-44`
with byte-identical copy.

Change. Move `passwordErrors` and its two message thunks into
`src/features/forms/` (account must not import the `user` feature).
`user-form.ts` and `account/schemas.ts` both consume the shared version; delete
the account copy and its `MESSAGES` entries.

Completion. One implementation of the rule and copy exists; account and user
specs pass unchanged.

### 3.6 Adopt `ValidatedFormField`
Where. `forms/ValidatedFormField.vue` has one consumer
(`UserIdentityPanel.vue`) while `MemberForm.vue:25-393` hand-writes the block
~13 times, and `account/SetPasswordForm.vue:6-45` /
`account/SendResetLinkView.vue:8-24` repeat it.

Change. Extend the component where needed (a `disabled` prop; make `labelCols`
default undefined so stacked-label forms work — existing consumers already pass
their own). Adopt it for MemberForm's plain fields and the two account forms,
keeping the companycode field's two-line feedback custom.

Completion. Those files import `ValidatedFormField`; no
`BFormGroup` + `b-form-invalid-feedback` block remains for a plain field; specs
and visual behavior are unchanged.

### 3.7 Honest write context in `useResourceForm`
Where. `forms/use-resource-form.ts:69,127`. On create, `id` is `Number(pk)` =
`NaN` and still passed as `{isCreate, id}`; `MaintenanceContractForm.vue:434-436`
works around it. `validate`/`parse` receive no context, so
`CustomerForm.vue:468` recomputes `!props.pk`.

Change the context to a discriminated union:
`{isCreate: true; id: null} | {isCreate: false; id: number}`, and pass it to
`validate` and `parse` as an optional second argument (existing callbacks that
ignore it stay assignable). Update the one `onSaved` caller and drop the
`!props.pk` recomputation.

Completion. `onSaved` never sees a `NaN` id, no form recomputes `isCreate` from
props, and typecheck passes.

## Phase 4. Test rigor

### 4.1 Port the account specs to the strict seam
Where. The five account network specs mock `@/services/api` and
`@/api/client.gen` through `api-client-mock.js`, so a dropped or renamed body
key cannot fail them. The Member slice uses `installApiSeam`, and the endpoints
are declared in `openapi/schema.yaml`.

Change. Move the five specs to `installApiSeam` and `settle()`, matching the
member specs. Fix the header comment at
`reset-password-request.spec.js:20-21`, which describes a fake the file does
not use.

Completion. No account spec imports `api-client-mock.js`. The specs fail if a
body key is dropped.

### 4.2 Wire or drop the orphaned member list goldens
Where. `tests/unit/golden/{contract,module,module-part,member}-list.json` exist,
but only the four form specs import the golden helper. `README.md:89` claims
each screen has goldens, and `golden/blocked.json` lists list scenarios no spec
runs.

Change. Either wire the four list specs to their goldens, or delete the files
and the blocked entries and soften the README claim.

Completion. The golden files are used by their specs or removed, and the README
matches.

## Phase 5. Lower-risk correctness

### 5.1 Page-1-only option lists and embedded tables
Where. Option lists load only page 1 at `CustomerForm.vue:482` (partners),
`MemberForm.vue:474` (contracts), and `ModulePartForm.vue:142` (modules).
Child collections render from page 1 at `MaintenanceContractForm.vue:470`,
`MaintenanceContractView.vue:213`, `DocumentPanel.vue:224`, and
`CustomerView.vue:338,370,377`. A tenant past 20 rows loses choices or rows.

Change. Request a large `page_size` or read the unpaginated source the contract
form already uses for modules. For the embedded detail tables, either paginate
or load the full set. Verify the backend's `page_size` ceiling first.

Completion. Each listed call site either requests the full set or paginates,
with a spec or a note on the chosen bound.

### 5.2 Read the `next` query after login
Where. `src/router/index.js:78,84,96` redirect to `/no-access?next=${to.path}`.
Nothing reads `next`, so the return target is dropped.

Change. Read `next` in `NoAccessView.vue` and pass it to the login flow, or
send the user there after a successful login. Keep the value on a same-origin
path.

Completion. A spec denies access to a path, logs in, and asserts the user
returns to that path. The spec fails before the change.

### 5.3 Generalize the revoke confirmed-action flow
Where. `src/features/user/api/ApiUserList.vue:194-197` keeps a local copy of
the confirmed-action modal because the list has a second confirmed action.
`useListDelete` is the same shape for delete.

Change. Generalize the confirmed-action helper so delete and revoke share it,
or accept the local copy as a documented exception. Prefer the shared helper.

Completion. Either `ApiUserList` uses the shared helper for both actions, or
the exception is written beside the code.

### 5.4 Invalidate the derived member and contract columns
Where. `src/features/member/invalidation.ts:15-23` refreshes the module list
and module-data, but a module or module-part write does not refresh the member
and contract lists that render `modules_text` and `contract_text`. The two
invalidations also `await` independent work sequentially.

Change. Add the member and contract list query keys to the module and
module-part invalidation, and `Promise.all` the independent invalidations.

Completion. A spec renames a module and asserts the member and contract list
queries are invalidated. The spec fails before the change.

### 5.5 Adjust `editingIndex` on row delete
Where. `MaintenanceContractForm.vue:568-575` splices `equipmentRows` without
adjusting `editingIndex` (`:528`), so deleting a row above the edited one
writes the edit into the wrong slot.

Change. Track the edited row by identity, or recompute `editingIndex` in
`deleteEquipment`.

Completion. A spec edits one row, deletes another above it, saves the edit, and
asserts the right row changed.

### 5.6 Encode the export `q` and flush the debounce
Where. `CustomerList.vue:225-230` appends `q=${globalFilter.value}` raw, and
`globalFilter` lags `searchDraft` by 300 ms.

Change. Build the export URL with `URLSearchParams`. Commit the draft on
download.

Completion. A spec exports a term containing `&` and asserts the URL is
encoded.

### 5.7 Route query-error toasts through the hook
Where. The hook exists (`forms/use-query-error-toast.ts`) and five sites
hand-roll it: `CustomerView.vue:325-330,358-363`, `DocumentPanel.vue:232`,
`MaintenanceContractView.vue:265-284`, `EngineerUserForm.vue:394`,
`CustomerUserForm.vue:243-248`. `CustomerView.vue:361` also toasts "Error
fetching orders" on the customer read, and the contracts read toasts nothing.

Change. Replace each hand-rolled watcher with `useQueryErrorToast`.
`MaintenanceContractView`'s message is dynamic — extend the hook to accept
`string | ((error) => string)` first. Give the customer read its own message
and add the missing contracts toast.

Completion. `grep -rn 'query.error' src/features --include='*.vue'` finds no
hand-rolled error toast; a failed customer read and a failed contracts read
each surface their own message.

### 5.8 Toast only on a successful clipboard write
Where. `ApiUserList.vue:99-107` toasts "Token copied" even when `writeText`
rejects.

Change. Await the write and toast on success, with an error toast otherwise.

Completion. A spec rejects the clipboard write and asserts the success toast
does not fire.

### 5.9 Reconcile the add-route gate with the button gate
Where. The add button is gated on `isStaff || isSuperuser`
(`EngineerUserList.vue:22`, `ApiUserList.vue:31`). The `engineer-add` and
`apiuser-add` routes carry no stricter meta and fall through to the default
planning auth level (`router/index.js:66`). Verify first that a planning user
can reach the route.

Change. Give the add routes the meta their buttons imply, or relax the
buttons. Match the intent.

Completion. A non-staff user cannot reach an add route their list hides. A spec
or a route-meta check proves it.

## Phase 6. Documentation and small cleanups

### 6.1 Enable `urlSync` or correct the ledgers
Where. Only `CustomerList.vue:212` sets `urlSync: true`. The four member lists
and all seven user lists omit it while their READMEs claim URL state.

Change. Per unit 0.2, add `urlSync: true` to each `useServerPagedList` call and
a URL-restore spec, or delete the URL claims from `member/README.md` and
`user/README.md` and the stale customer row `customer/README.md:107`.

Completion. The ledgers match the code, and a spec asserts the URL state where
the feature is enabled.

### 6.2 Recreate `schema-strengthenings.md`
Per unit 0.3, create `docs/schema-strengthenings.md` listing every surviving
strengthening with its reason, or move the content into `form-schemas.md` and
fix the four references.

Completion. The path exists with the content, or the references point at the
file that holds it.

### 6.3 Fix the `form-schemas.md` pointer
Where. `docs/agents/form-schemas.md:95` points at
`src/features/shared/form-validation.ts`. The file is
`src/features/forms/validation.ts`.

Completion. The path resolves.

### 6.4 Fix stale comments and README file names
Where. `use-resource-form.ts:33-38` says `reasonOf` is not adopted while
`MemberForm.vue:541` adopts it. `member/README.md:109` names three deleted
files, and `:52` points at `member/use-company-code-probe.ts` instead of
`member/member/`. `account/README.md:3-9` scopes the slice to files outside it.

Change. Update the `reasonOf` comment to name its adopter. Delete the dead file
names and fix the probe path. Scope the account README intro to the folder and
label out-of-folder rows as migrated call sites.

Completion. No README or comment names a file or behavior the code does not
have.

### 6.5 Sweep the small cleanups
Each item verified against the source first; fix or dismiss with a reason.

- `MemberForm.vue:584` — derive member types from `vMemberTypeEnum.options`
  instead of hardcoding.
- `MemberForm.vue:106-118,313-325` — render the `has_branches` checkbox once.
- `LogoUploadField.vue` — move into `member/member/`; it depends on that
  sub-feature's schema, not the other way round.
- `CustomerForm.vue:462` — move the `branch_id` normalization out of `validate`
  into `fromRecord`/`parse`.
- `CustomerView.vue:73-78,200-205` — remove the dead slots for field keys that
  do not exist; remove the unused bindings at
  `MaintenanceContractForm.vue:639-647`.
- `account/schemas.ts:41,47` — drop the `isRegistration: false` spreads if the
  generated default already covers them (verify against the wire first).
- `LoginForm.vue:74-75` — give each field its own validity.
- `auth/store.ts:75-79` — type `branchEmployeeBranch` as `number | false`.
- Trim remaining dead exports: `TariffRow`, `ServerPagedListConfig`,
  `useUrlQuerySync` (verify each with grep first).

Completion. Every item is fixed or dismissed in writing, and the checks pass.

## Phase 7. Structural consolidation

Do these after Phases 0–6 are green. Each is behavior-preserving and
independent; schedule them as separate tickets if that reads better. They are
the ambitious restructurings, so hold them to the same regression-test bar.

### 7.1 Extract the staged-equipment panel
Where. `MaintenanceContractForm.vue` (685 lines) mixes contract fields,
customer autocomplete, staged equipment CRUD, the quick-create modal, and focus
choreography. Units 1.2, 1.7, and 5.5 all cluster in the staged-equipment
logic.

Extract `StagedEquipmentPanel.vue` plus `useEquipmentStaging` (rows, deleted
ids, row-edit copy, add/edit/delete, replay, modal and multiselect). The parent
keeps contract fields and the `onSaved` replay call.

Completion. The form is a focused orchestrator (roughly ≤300 lines), equipment
specs drive the panel, and behavior is unchanged.

### 7.2 Decompose `CustomerForm` and `MemberForm`
`CustomerForm.vue` (633): extract `CustomerBranchPanel` (template 302-377,
script 482-624) and `CustomerFinancialsPanel` (219-300). Apply 3.6 to
`MemberForm` first if not already done.

Completion. Each file owns one concept and specs pass.

### 7.3 One token source
Where. `auth/store.ts:36-40,85-93,107-116`, `auth/token-storage.ts`,
`auth-header.ts:12`, `TokenRefresh.vue:36`. The token has two hand-synchronised
sources: the store seeds from storage, writes storage on authenticate/logout,
re-reads it in refresh, while the request path and timer read storage directly.
Consequences: no cross-tab logout, and a storage exception surfaces as a login
failure after the API call succeeded.

Change. Replace the pair with a module-scoped VueUse
`useLocalStorage<string | null>(TOKEN_KEY, null)` ref in
`features/auth/token.ts` (wrap in `effectScope()` if VueUse warns outside
setup). The store, `auth-header`, and the refresh timer read and write that one
ref. Delete `token-storage.ts` and update its spec coverage; cross-tab logout
follows from `useStorage`'s storage-event sync — add a spec for it. Apply unit
0.4's reload decision in the same pass if it changes refresh.

Completion. No `getStoredToken` / `setStoredToken` / `clearStoredToken` remain;
auth specs pass; the cross-tab spec pins logout propagation.

### 7.4 Type the login and refresh boundary
Where. `auth/store.ts:94-116` posts raw axios; the generated ops exist
(`jwtTokenCreate`, `jwtTokenRefreshCreate`) and the response is typed `unknown`
(`types.gen.ts:21428-21446`).

Change. Parse the login and refresh responses with a small valibot object
(`{token: v.string()}`) or fix the OpenAPI/codegen annotation so the generated
op carries the response type, then use the generated ops. No unparsed `any`
reaches `authenticate`. Update the specs that assert raw axios.

Completion. `store.ts` makes no raw `client.post('/jwt-token/...')` call, and a
missing token fails at the boundary instead of storing `undefined`.

## Considered and deferred

**Collapsing the table kit into one `useServerTable` + `ServerTable.vue`.** A
review found real accretion: the `tableOptions` bridge every list spreads
(`server-paged-list.ts:165-193`), `ListTablePanel` as an identity wrapper, and
`ServerDataTable` / `ServerTablePagination` with one consumer each. But
ADR-0005 rejected generic collection factories for this rewrite, and the kit is
coherent and genuinely adopted by all 12 lists. The consolidation is a
restructure, not a bug fix, and the payoff is smaller than Phase 1–6. Revisit
only with a fresh decision, and only if a second real consumer of the
components appears.

## Keep as is

- The seven user subdomains stay separate. Their `fromRecord`, `payloadOf`,
  columns, and extras genuinely differ, so merging them fails the "must both
  change together" test.
- No generic list factory (ADR-0005).
- The table and form kits keep their shape. The work above removes their dead
  edges, not their design.
- The availability probes stay outside the query options (`member/README.md`
  rule 3): their verdict is per-keystroke state and must not be cached. Both
  call a generated SDK op — the username probe joined the company-code one
  when `/api/company/username-exists/` declared its `username` parameter, so
  no raw-axios call is left in `src/features/`.
- `any` in `useResourceForm`'s mutation options is documented contravariance.
- `ListDeleteModal`'s `defineExpose` is a real API.
- The auth → `stores/main` seam is a documented transitional dependency.

## Definition of done

- Every unit's completion criterion holds.
- `npm run typecheck`, `npx eslint src/features`, and `npm test` pass after
  every unit; `npm run build` passes at the end of each phase.
- Every correctness fix has a regression test that failed before the change.
- No README or comment names a file or behavior the code does not have.
- The Phase 0 decisions are written down with their evidence.
- At each phase boundary and at the end, summarize: what changed and why,
  decisions taken, shared abstractions extended, libraries used or deliberately
  not used, what was left unchanged, and any remaining concerns. Keep the
  per-unit completion evidence (spec names, grep results) in the summary so a
  reviewer can rerun it.
