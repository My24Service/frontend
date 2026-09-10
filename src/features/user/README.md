# The User Slice

Fourteen screens in seven groups — engineer, sales, customer, planning,
employee, student and API users, each list + form (plus the student detail,
register, verify and reset-password screens) — being rewritten end to end as
the third Slice of the rewrite. Sales users went first, planning users
second, customer users third; each type follows the same shape. This
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
engineer/             (next) the engineer list, form and schemas
...
use-username-probe.ts the shared username-availability probe
```

`src/models/company/UserSales.js`, `src/models/company/UserPlanning.js` and
`src/models/company/UserCustomer.js` are deleted — the converted screens were
their only consumers, and read the generated queries directly. The remaining
four `User*.js` models stay until their own types convert; each dies with its
type's ticket. `src/views/company/User*.vue` stays mounted for the
unconverted types until then. The customer autocomplete the converted form
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

## Declared exceptions — the ledger

Every deliberate behaviour change made while converting, so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere; the specs
assert the routes verbatim.

| # | Screen(s) | Exception | Why |
|---|---|---|---|
| 1 | Sales list | Search term and page now live in the URL | The Slice's URL-state pattern, now the kit's `urlSync`; the legacy term died on reload |
| 2 | Sales list | The type pills are gone from the screen | Navigation chrome belongs in the subnav shell, not in every list; member and customer lists render no pills either |
| 3 | Sales form | Bodies carry exactly the write schemas' fields | The legacy create posted password1/password2/id/full_name and the counts, the edit round-tripped date_joined/last_login; the parse drops everything the schema does not declare |
| 4 | Sales form | The username probe is debounced (500 ms), not per keystroke | The member ticket's requirement; the legacy probe fired per keystroke through vuelidate's async rule |
| 5 | Sales form | The taken-username refusal no longer waits a second | The legacy `preSubmitForm` deferred every submit by a fixed timeout so the async rule could answer; the converted save waits out the actual in-flight probe instead |
| 6 | Planning list | Same as #1–#2, plus the company/settings dual mount | The legacy list mounted twice with `linkAdd`/`linkEdit` computeds switching route names; the converted screen keeps the `fromSettings` prop contract so both routers mount one component |
| 7 | Planning form | Same as #3–#5 | Same legacy shape, same conversion |
| 8 | Customer list | Same as #1–#2, plus the linked-customer cell | The legacy `#cell(customer)` slot rendered `customer_details.name, city` or the no-customer fallback; the converted display column renders the same join as text |
| 9 | Customer form | Same as #3–#5, plus the customer picker | The legacy VueMultiselect drove `customerModel.search()` through the customer Shim; the converted picker feeds the generated autocomplete query with the same debounce, and its select/clear pins/nulls the id the same way |

## Manual browser checklist

`docs/manual-checklists.md` — walk the sales-user, planning-user and
customer-user lists against a development tenant after any cross-cutting
change.
