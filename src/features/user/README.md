# The User Slice

Seventeen screens in seven groups — engineer, sales, customer, planning,
employee, student and API users, each list + form, plus the student detail
and the public student registration (register, verify). All are converted.
This directory follows the Member Slice (`src/features/member/`, the
reference implementation): the same rules, the same testing bar. Read this
file for what the User Slice adds on top.

## Layout

```
index.ts              the one door; the router mounts what is exported here
sales/                the converted sales-user list, form and schemas
planning/             the converted planning-user list, form and schemas
customer/             the converted customer-user list, form and schemas
engineer/             the converted engineer-user list, form and schemas
employee/             the converted employee-user list, form and schemas
student/              the converted student-user list, form and schemas, the
                      detail screen, and the public registration (its own
                      contract in registration.ts; see below)
api/                  the converted API-user list, form and schemas
...
use-username-probe.ts the shared username-availability probe
user-form.ts          the identity fields and copy shared by the forms, and
                      the validate/parse contract each type instantiates
user-list-columns.ts  the name/username/email/last-login/date-joined columns shared by six lists
use-user-form.ts      the create/edit skeleton shared by the seven forms
UserIdentityPanel.vue the identity block shared by the seven forms
```

`src/models/company/UserEngineer.js` stays: invoice, order, map and event
screens import its service and models directly, outside the converted
screens. The `src/models/customer/Customer.js` Shim stays — quotation, order,
invoice, equipment and company screens still import it.

## The student registration

A student signs up through `/company/student-users/register` (public), then
follows a mailed link to `…/register/verify` and, once verified, asks for
the link that sets their first password. That last step lands on
`…/register/reset-password`, which mounts the account slice's
`ResetPasswordConfirmView` directly — the legacy wrapper around it did
nothing but add a padding class.

`POST /accounts/register/` has its own request body,
`StudentUserRegisterRequest`: no username or password (the backend derives
the username from the email; the password comes through the verification
link), and the address, mobile and introduction the staff form leaves
optional are required. `registration.ts` binds that generated body directly
and adds no rule of its own; the mobile is normalized to E.164 at the wire
(`src/features/forms/phone.ts`) so the user may type it however they like.

Two things the legacy screen did are gone on purpose: it posted the staff
form's defaults for gender, driving licence and box truck on a registrant's
behalf (choices no registrant made), and it sent `contract_hours_week` as a
number where the schema says string — which is why its wire body fails the
strict API seam and the converted one does not.

## What this Slice adds to the reference pattern

### The shared username probe

All seven forms validate username uniqueness through the same debounced
probe (`./use-username-probe.ts`), the username twin of the member
company-code probe: per-keystroke state, an in-flight barrier the save waits
behind, and a stale verdict that never overwrites the current value.
`GET /api/company/username-exists/` declares `username` as a required query
parameter, so the probe calls the generated op
(`companyUsernameExistsRetrieve({query: {username}})`) exactly as the
company-code twin does, and the client encodes the value — a `+` in a
username reaches the wire percent-encoded, not decoded to a space. Its spec
answers through the strict seam like every other converted read.

### The endpoints declare no `ordering` parameter

The user list endpoints declare only `page`/`page_size`/`q`. A sort the wire carried would be
silently dropped by the seam, so the columns stay non-sortable
rather than sending a parameter nothing honours.

### Composition over repetition

The seven lists share the table shell in `src/features/table/`, each screen
reaching it through the kit's one door (`@/features/table`) —
`ServerTable.vue` (header with its slots, the table and its pagination, and
the delete confirmation), the `useServerTable` engine behind it, `ListRow`
and `createActionColumn` (icons, edit route optional) — and the
seven forms share `use-user-form.ts` (the `use-resource-form` skeleton from
`src/features/forms/` plus the probe barrier, the taken-username refusal
and the password assembly) with `UserIdentityPanel.vue` for the identity
block. Each screen keeps only its ops, its copy and its genuine extras
(pickers, toggles, token cells). The wrapper is generic over each form's
own values type — it constrains them to the `username` / `password1` /
`password2` it reads — and `UserIdentityPanel` is generic over the same
type.

### The values are the wire shape

A form's values are the request body as the form holds it, plus the two
client-only passwords: `UserFormValues<typeof vXRequestWritable>` (the
`v.InferInput` of the generated schema intersected with the identity block).
Nothing is flattened, so nothing is re-nested: `empty()` is the one
hand-written object per type, `fromRecord` is two `filledFrom` calls (the
identity block from the record, the sub-object from its `x_user`), and the
type's `validateXUserForm` / `parseXUserForm` pair is one `userFormContract`
call. A per-type `payloadOf` exists only where a schema cannot take an input
blank (a nullish date, an optional-but-non-empty IBAN); `check` adds the one
rule a schema cannot express (the engineer's required location).

`filledFrom(defaults, record)` keys by the defaults, so a read-only
companion the record carries (`uuid`, `picture_url`)
never lands on the form — the form reads those off the wrapper's `record`
when it needs to show them.

## Declared exceptions — the ledger

Behaviour the Slice deliberately changed, collected so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere; the specs
assert the routes verbatim.

| Screen(s) | Exception | Why |
|---|---|---|
| Sales list | The page and the search term live in the URL | All seven lists pass the kit's `urlSync` option, as the Member and Customer ones do: defaults stay out of the address, a shared address restores the view — page included — before the first request, and the address carries exactly the wire query, because the seven list routes are plain paths with no query parameter of their own to leak into a filter |
| Sales list | The type pills are gone from the screen | Navigation chrome belongs in the subnav shell, not in every list; member and customer lists render no pills either |
| Sales form | Bodies carry exactly the write schemas' fields | The parse drops everything the schema does not declare |
| Sales form | The username probe is debounced (500 ms), not per keystroke | Per-keystroke probing spams the endpoint |
| Sales form | The taken-username refusal waits out the in-flight probe | No fixed timeout; the save waits behind `waitForProbe` |
| Planning list | Same as the sales list, plus the company/settings dual mount | The list mounts twice; the `fromSettings` prop contract lets both routers mount one component |
| Planning form | Same as the sales form | Same shape |
| Customer list | Same as the sales list, plus the linked-customer cell | The display column renders `customer_details.name, city` or the no-customer fallback as text |
| Customer form | Same as the sales form, plus the customer picker | The picker feeds the generated autocomplete query with the same debounce, and its select/clear pins/nulls the id the same way |
| All three forms | The username charset (`/^[\w.@+-]+$/`) is checked before submit, with its own message | The generated entry declares it; the forms parse the generated entry (`docs/agents/form-schemas.md`) |
| Engineer list | Same as the sales list, plus the mobile display cell | The display column renders the nested `engineer.mobile` as text, non-sortable like the rest |
| Engineer list | The export download is gone; the add link is staff-gated | Slice convention, matching sales/customer |
| Engineer form | Same as the sales form, plus the location picker/create flow | The picker feeds the generated list op and creates through the generated create op |
| Engineer form | `preferred_location` is required on the write, nullable on the read | 74 of 206 engineers have null, so the response stays nullable; the write serializer refuses null and the form parses the generated entry with no rule of its own |
| Employee list | Same as the planning list (company/settings dual mount) | Both routers pass `fromSettings` and the edit route passes `pk` |
| Employee form | Same as the planning form, plus the branch picker / branch-employee pinning | The picker feeds the generated branch list op, branch employees pin to their own branch via the generated my-branch op. `uses_time_registration` is no longer sent: absent on create defaults to `True`, absent on edit keeps the stored value |
| Student list | Same as the sales list, plus the in-place active toggle and the detail link | The name links to the detail screen, not the edit page as in the sibling lists. The toggle PATCHes `{is_active}` only; the patched schema has no required keys |
| Student form | Same as the sales form | Bodies carry exactly the write-schema fields; blank `dob`/`iban` shape to null/absent |
| API-user list | Same as the sales list, plus the token-lifecycle cell | Token + copy, Active/Revoke/Valid-until vs Revoked, with a revoke confirmation modal; the renew endpoint takes a full body nobody calls and stays unwired |
| API-user form | Same as the sales form, plus `expire_start_dt` required and ISO timestamps | `expire_start_dt` is `NOT NULL DEFAULT now()` so absent is impossible; the prefill is UI convenience |
| All lists | Header, panel and delete modal come from the shared table shell | Same toolbar markup, same modal ids, same copy; sales/planning/engineer/employee stay delete-only in the icons column, customer/student/API keep their edit icons |
| All forms | Skeleton, probe wiring and identity block come from the shared form kit | Same input ids, same messages, same wire bodies |

## Manual browser checklist

Walk the user lists against a development tenant after any cross-cutting
change.
