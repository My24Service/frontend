# The User Slice

Fourteen screens in seven groups — engineer, sales, customer, planning,
employee, student and API users, each list + form (plus the student detail,
register, verify and reset-password screens) — being rewritten end to end as
the third Slice of the rewrite. All seven list+form pairs are converted; the
student detail, register, verify and reset-password screens stay legacy on
follow-ups. This
directory follows the Member Slice (`src/features/member/`, the reference
implementation): the same rules, the same testing bar, the same shape of
ADRs. They are not restated here; read this file for what the User Slice
adds on top and where it had to differ from the legacy behaviour.

## Layout

```
index.ts              the one door; the router mounts what is exported here
sales/                the converted sales-user list, form and schemas
planning/             the converted planning-user list, form and schemas
customer/             the converted customer-user list, form and schemas
engineer/             the converted engineer-user list, form and schemas
employee/             the converted employee-user list, form and schemas
student/              the converted student-user list, form and schemas
api/                  the converted API-user list, form and schemas
...
use-username-probe.ts the shared username-availability probe
user-form.ts          the identity fields, password rules and copy shared by the forms
use-user-form.ts      the create/edit skeleton shared by the seven forms
UserIdentityPanel.vue the identity block shared by the seven forms
```

`src/models/company/UserSales.js`, `src/models/company/UserPlanning.js`,
`src/models/company/UserCustomer.js`, `src/models/company/UserEmployee.js`
and `src/models/company/UserApi.js` are deleted — the converted screens were
their only consumers, and read the generated queries directly.
`src/models/company/UserEngineer.js` stays: invoice, order, map and event
screens import its service and models directly, outside the converted
screens. `src/models/company/UserStudent.js` stays: the legacy detail and
register screens still read through it. The converted screens they served
are deleted; `src/views/company/UserStudentDetail.vue`,
`UserStudentForm.vue` (register mode only), `UserStudentRegisterVerify.vue`
and `UserStudentRegisterResetPassword.vue` stay mounted until their
follow-ups. The customer autocomplete the converted form
needed already rode the generated op (migrated earlier); the
`src/models/customer/Customer.js` Shim stays — quotation, order, invoice,
equipment and company screens still import it.

## What this Slice adds to the reference pattern

### The shared username probe

All seven forms validate username uniqueness through the same debounced
probe (`./use-username-probe.ts`), the username twin of the member
company-code probe: per-keystroke state, an in-flight barrier the save waits
behind, and a stale verdict that never overwrites the current value. The
endpoint (`GET /api/company/username-exists/`) declares no query parameters,
so the request validator on the generated op rejects the needed request
before it leaves — the probe rides the shared axios instance directly with
`?username=`, exactly as the legacy `usernameExists` helper did. The probe
spec answers at that instance; the strict seam only ever sees generated
traffic.

### Sorting the legacy tables never had

The legacy user lists rendered `sortable: true` columns over a `BaseModel`
that only ever sent `sort_field`/`sort_dir` — and the converted endpoints
declare only `page`/`page_size`/`q`. A sort the wire carried would be
silently dropped by the seam, so the converted columns stay non-sortable
rather than sending a parameter nothing honours.

### Composition over repetition

The seven lists share the table shell in `src/features/table/` —
`ListPageHeader` (title, refresh, search, add slot), `ListTablePanel`
(table + pagination wiring), `ListDeleteModal` (confirm + `useListDelete`),
`ListRow` and `createActionColumn` (icons, edit route optional) — and the
seven forms share `use-user-form.ts` (the `use-resource-form` skeleton from
`src/features/forms/` plus the probe barrier, the taken-username refusal
and the password assembly) with `UserIdentityPanel.vue` for the identity
block. Ported from the `implement-code-review` branch's forms kit, minus
its `create-form-validation.ts`: that helper puts `$trans` in schema pipes,
which `docs/agents/form-schemas.md` retires in favour of `fieldErrors`.
Each screen keeps only its ops, its copy, its record mapping, its
`validateXUserForm` / `parseXUserForm` pair and its genuine extras
(pickers, toggles, token cells). The wrapper is generic over each form's
own values type — it constrains them to the `username` / `password1` /
`password2` it reads — and `UserIdentityPanel` is generic over the same
type, so no form needs an index-signature copy of its values.

## Declared exceptions — the ledger

Every deliberate behaviour change made while converting, so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere; the specs
assert the routes verbatim. The one thing the conversion did drop — the list
state the legacy screens kept in the route query — is restored in row 1.

| # | Screen(s) | Exception | Why |
|---|---|---|---|
| 1 | Sales list | The page and the search term live in the URL | The legacy screen restored `page` from `$route.query` in `created()` and its `Pagination` pushed `page`/`q` back; the converted list was written straight onto `useServerPagedList` without the kit's `urlSync`, so that state went with the legacy components (plan 6.1, decision 0.2). All seven lists now pass the option, as the Member and Customer ones do: defaults stay out of the address, a shared address restores the view — page included — before the first request, and the address carries exactly the wire query, because the seven list routes are plain paths with no query parameter of their own to leak into a filter |
| 2 | Sales list | The type pills are gone from the screen | Navigation chrome belongs in the subnav shell, not in every list; member and customer lists render no pills either |
| 3 | Sales form | Bodies carry exactly the write schemas' fields | The legacy create posted password1/password2/id/full_name and the counts, the edit round-tripped date_joined/last_login; the parse drops everything the schema does not declare |
| 4 | Sales form | The username probe is debounced (500 ms), not per keystroke | The member ticket's requirement; the legacy probe fired per keystroke through vuelidate's async rule |
| 5 | Sales form | The taken-username refusal no longer waits a second | The legacy `preSubmitForm` deferred every submit by a fixed timeout so the async rule could answer; the converted save waits out the actual in-flight probe instead |
| 6 | Planning list | Same as #1–#2, plus the company/settings dual mount | The legacy list mounted twice with `linkAdd`/`linkEdit` computeds switching route names; the converted screen keeps the `fromSettings` prop contract so both routers mount one component |
| 7 | Planning form | Same as #3–#5 | Same legacy shape, same conversion |
| 8 | Customer list | Same as #1–#2, plus the linked-customer cell | The legacy `#cell(customer)` slot rendered `customer_details.name, city` or the no-customer fallback; the converted display column renders the same join as text |
| 9 | Customer form | Same as #3–#5, plus the customer picker | The legacy VueMultiselect drove `customerModel.search()` through the customer Shim; the converted picker feeds the generated autocomplete query with the same debounce, and its select/clear pins/nulls the id the same way |
| 10 | All three forms | The username charset (`/^[\w.@+-]+$/`) is checked before submit, with its own message | The generated entry has always declared it and the API has always enforced it; these forms redeclared `username` and dropped the regex, so a name like `jan jansen` reached the wire and came back a 400. Restored by parsing the generated entry (`docs/agents/form-schemas.md`) |
| 11 | Engineer list | Same as #1–#2, plus the mobile display cell | The legacy `engineer.mobile` column read the nested sub-object; the converted display column renders it as text, non-sortable like the rest |
| 12 | Engineer list | The export download is gone; the add link is staff-gated | Slice convention, matching sales/customer; the legacy download hit `/company/engineer-export-xls/` behind a confirm |
| 13 | Engineer form | Same as #3–#5, plus the location picker/create flow | The legacy select + create-new-location drove the stock-location Shim; the converted picker feeds the generated list op and creates through the generated create op. The stock-location ops declare a required `Authorization` header the interceptor sets after validation — the shared `SESSION_AUTH_HEADER` placeholder (`src/features/shared/`) satisfies the validator |
| 14 | Engineer form | `preferred_location` is refused empty on the form, optional on the wire | Pre-existing engineers predate the requirement; the API must stay lax, the form need not be |
| 15 | Employee list | Same as #6 (company/settings dual mount) | The legacy settings tree never passed `fromSettings` and its edit route passed no `pk`, so it mounted company routes and a blank create form; the converted screen keeps the prop contract and both routers now pass what planning's do |
| 16 | Employee form | Same as #7, plus the branch picker / branch-employee pinning | The legacy picker drove the branch Shim with a `-`/null first option; the converted picker feeds the generated branch list op, branch employees pin to their own branch via the generated my-branch op |
| 17 | Student list | Same as #1–#2, plus the in-place active toggle and the detail link | The name links to the legacy detail view, not the edit page as in the sibling lists — kept until the detail follow-up. The toggle PATCHes through the generated partial-update op |
| 18 | Student form | Same as #3–#5 | Bodies carry exactly the write-schema fields; blank `dob`/`iban` shape to null/absent as the legacy deletes did |
| 19 | API-user list | Same as #1–#2, plus the token-lifecycle cell | Token + copy, Active/Revoke/Valid-until vs Revoked, with a revoke confirmation modal; the renew endpoint takes a full body nobody calls and stays unwired |
| 20 | API-user form | Same as #3–#5, plus `expire_start_dt` required and ISO timestamps | Optional on the wire but meaningless absent; the legacy `YYYY-MM-DD` payloads and the expire-days copy ("Name is required") are fixed |
| 21 | All lists | Header, panel and delete modal come from the shared table shell | Visual no-op: same toolbar markup, same modal ids, same copy; sales/planning/engineer/employee stay delete-only in the icons column, customer/student/API keep their edit icons |
| 22 | All forms | Skeleton, probe wiring and identity block come from the shared form kit | Visual no-op: same input ids, same messages, same wire bodies; the per-field feedback ids on kit-rendered rows are gone (specs target inputs) and the customer overlay now also reflects the autocomplete fetch |

## Manual browser checklist

`docs/manual-checklists.md` — walk the user lists against a development
tenant after any cross-cutting change.
