# Strengthenings still carried by the frontend

## What this is

A form in a Slice parses the generated valibot request schema and
sends the parse output (ADR-0003). Twelve places in `src/features/` still add a
rule the generated schema does not carry. Each one is the same statement:
*this form requires something the API says is optional*, and each is the
second kind below: the API must stay lax about them and the form need not be.

Entries of the first kind — the contract itself is off — go under "Owed by
the backend" until the backend fixes them; that section is currently empty.
Its former entries are kept in "Paid" as the record of what was asked and
what landed.

Every entry below quotes the generated line it was checked against
(`src/api/valibot.gen.ts:line`), so "the generated schema does not already say
this" is checkable rather than asserted. Regenerate the line numbers with
`rg -n` against `src/api/valibot.gen.ts` after each `npm run codegen`.

## Kept, because the API must stay lax

### 1. Customer `customer_id`

**Frontend**: `src/features/customer/customer/schemas.ts:10-12`,
`requiredCustomerId()`, spread into both `customerFormSchema` and
`customerCreateSchema` (`:14-25`). Piped onto the generated entry rather than
redeclared, so its `maxLength(100)` stays where codegen puts it.

**Generated**: `customer_id: v.nullish(v.pipe(v.string(), v.maxLength(100)))`
— `valibot.gen.ts:1380` in `vCustomerCreateRequest`, `:6726` in
`vPatchedCustomerRequest`.

**Reality**: 294 of 22,800 customers across the tenants have a blank or null `customer_id`
(ritehite 87; kms 59, of which 15 are true nulls), and members with
`customer_id_autoincrement` create customers without one deliberately. The
column cannot be tightened without either losing those rows or inventing a
value for them, so the rule belongs to the form.

**Backend change**: none.

**Case 2.**

### 2. Customer patch: which fields must be present

**Frontend**: `src/features/customer/customer/schemas.ts:14-20`,
`customerFormSchema = v.required(v.object({...vPatchedCustomerRequest.entries,
customer_id: …}), ['name', 'address', 'postal', 'city', 'country_code'])`.
`v.required` lifts the optional off five named entries and keeps whatever
codegen put underneath each one.

**Generated**: all five are `v.optional(...)` on `vPatchedCustomerRequest` —
`valibot.gen.ts:6712` `name`, `:6713` `address`, `:6714` `postal`,
`:6715` `city`, `:6716` `country_code`.

**Reality**: PATCH has to accept a partial body, so the generated optionality is
correct and cannot be withdrawn. This form never submits a partial body — it
saves a whole customer — so it refuses what the endpoint would accept. A
cross-field rule about *this form's* write, not about the resource.

**Blast radius**: none. The restriction never leaves the create/edit screen; a
PUT from any other client is unaffected.

**Backend change**: none.

**Case 2.**

### 3. Maintenance contract `name`

**Frontend**: `src/features/customer/maintenance-contract/schemas.ts:29`,
`name: v.pipe(v.unwrap(vMaintenanceContractRequest.entries.name),
v.minLength(1))` in `maintenanceContractSchema`.

**Generated**: `name: v.nullish(v.pipe(v.string(), v.maxLength(255)))`
(`valibot.gen.ts:3702`) — `MaintenanceContract.name` is
`CharField(max_length=255, blank=True, null=True)`.

**Reality**: 5 of the 9 contracts on stormy have no name, so the column cannot be tightened
without losing them. The form requires a contract name and always has.

**Backend change**: none.

**Case 2.**

### 4. Maintenance equipment `equipment`

**Frontend**: `src/features/customer/maintenance-contract/schemas.ts:90`,
`equipment: v.unwrap(vMaintenanceEquipmentRequest.entries.equipment)`, and
again as the row check at `:157` in `equipmentRowErrors`.

**Generated**: `equipment: v.nullish(v.pipe(v.number(), v.integer()))`
(`valibot.gen.ts:3737`), beside `equipment_name: v.pipe(v.string(),
v.minLength(1), v.maxLength(255))` (`:3738`).

**Reality**: the FK is `null=True, blank=True, on_delete=SET_NULL`, which is a
deliberate "the equipment was deleted, keep the row" arrangement. The column
must accept null because `SET_NULL` writes one, and the row is meaningful
without it — it carries its own `equipment_name`. The *form* refuses to create
a row without an equipment. A genuine form-only rule.

**Backend change**: none. Keep the frontend rule, keep the comment.

**Case 2.**

### 5. Maintenance equipment `times_per_year` above zero

**Frontend**: `src/features/customer/maintenance-contract/schemas.ts:158`, in
`equipmentRowErrors`: a filled frequency must parse to a number greater than
zero. Unfilled is allowed — the field is optional on this form and the wire.

**Generated**: `times_per_year: v.optional(v.pipe(v.number(), v.integer(),
v.minValue(0), v.maxValue(2147483647)))` (`valibot.gen.ts:3739`). Note the
floor codegen emits: `minValue(0)`, because the column allows zero.

**Reality**: a stored `0` is representable and the API is right to accept it —
a schedule of zero visits a year is not something this form will save, which is
a product rule the endpoint has no opinion about. The rule is a function beside
the parse rather than a pipe onto the entry, because the form's state carries
the frequency as a string and emptiness has to be distinguished from zero
before the number reaches the schema.

**Backend change**: none.

**Case 2.**

### 6. Member `companycode`, minimum two characters

**Frontend**: `src/features/member/member/schemas.ts:15`,
`companycode: v.pipe(vMemberMemberCreateBody.entries.companycode,
v.minLength(2))` in `memberFormSchema`. Piped onto the generated entry rather
than redeclared, so the `maxLength(30)` and any later addition upstream still
apply.

**Generated**: `companycode: v.pipe(v.string(), v.minLength(1),
v.maxLength(30))` — `valibot.gen.ts:4190` in `vMemberRequest`, which
`vMemberMemberCreateBody` aliases at `:20278`.

**Reality**: the code is the tenant's subdomain label (`MemberForm.vue` prints
`[companycode].my24service.com` under the field), so the minimum belongs to the form and not to the column.

**Backend change**: none. A product rule, not a contract gap.

**Case 2.**

### 7. Member `requireLogo` — the create flow only

**Frontend**: `src/features/member/member/schemas.ts:104-115`,
`validateMemberForm(values, {requireLogo})`. The rule is the
`if (requireLogo && !values.companylogo)` branch at `:110`, beside the parse
rather than piped onto an entry: it is conditional on which flow is calling, and
a schema cannot carry a condition that is not a property of the request.

**Generated**: `companylogo: v.nullish(v.string())` — `valibot.gen.ts:4204`
in `vMemberRequest` (`vMemberMemberCreateBody`, `:20278`).

**Reality**: signup cannot finish without an uploaded logo, so the create flow
passes `isCreate` through as `requireLogo`. A member record without a logo is ordinary data, so this is a product rule
about the signup screen, not a gap in the contract.

**Backend change**: none.

**Case 2.**

### 8. API user `api_user.expire_start_dt`

**Frontend**: `src/features/user/api/schemas.ts:45-53`, `apiUserFormSchema`,
with `expire_start_dt: v.pipe(v.unwrap(vApiUserSubRequest.entries.expire_start_dt),
v.minLength(1))` at `:49`. `payloadOf` leaves the key absent when the date
input is cleared, so the strengthened entry refuses it instead of an
unparseable string riding the wire.

**Generated**: `expire_start_dt: v.optional(v.pipe(v.string(),
v.isoTimestamp()))` (`valibot.gen.ts:223`). `vApiUserSubRequest` requires only
`name` (`:222`) and `expire_in_days` (`:224`).

**Reality**: a token without a start has no validity window to display — an
absent start degrades the list's "Valid until" cell rather than failing the
request, so the endpoint stays permissive and the form demands the date. The form prefills today.

**Backend change**: none.

**Case 2.**

### 9. Engineer `preferred_location`

**Frontend**: `src/features/user/engineer/schemas.ts:71-75`, the `check`
the type hands `userFormContract` — a form-level rule beside the parse, like
the password rules in `../user-form.ts`, not a redeclared entry, so codegen
keeps everything underneath.

**Generated**: `preferred_location: v.nullish(v.pipe(v.number(), v.integer()))`
— `valibot.gen.ts:13203` in `vEngineerRequestWritable` (and `:2225`,
`:2256` on the read/response components).

**Reality**: existing engineers predate the field, so null is real stored data
and the endpoint must keep accepting it. The form will not save without one.

**Backend change**: none.

**Case 2.**

### 10. Reset-link `email`

**Frontend**: `src/features/account/schemas.ts:29`,
`sendResetLinkSchema = v.required(vAccountsSendResetPasswordLinkCreateBody,
['email'])`. `v.required` rather than a redeclared entry: it lifts the optional
off and keeps the generated `minLength(1)` underneath.

**Generated**: `email: v.optional(v.pipe(v.string(), v.minLength(1)))`
(`valibot.gen.ts:9109`), beside `user_id: v.optional(v.pipe(v.number(),
v.integer()))` (`:9108`) and `isRegistration` (`:9107`).

**Reality**: the endpoint takes either a `user_id` or an `email`, so it cannot
require either — the request is valid with the other one. This form only ever
sends the email, so it requires that.

**Backend change**: none.

**Case 2.**

### 11. Account set-password confirmation

**Frontend**: `src/features/account/schemas.ts:65-67`,
`validateSetPassword` → `passwordErrors(values, {isCreate: true})`, the shared
rule in `src/features/forms/password-rules.ts`. It confirms `password2` against
`password1` and refuses a blank `password1`.

**Generated**: `vResetPasswordRequest` carries `user_id`, `timestamp`,
`signature` and `password` (`valibot.gen.ts:8901-8906`). There is no
`password2` entry to constrain, and `account/schemas.ts` does not restate
`password`: the generated entry already requires a non-blank one
(`:8905`).

**Reality**: the confirmation never rides the wire, so no request schema can
hold it. That is what makes it a client-only field rather than a contract gap.

**Backend change**: none.

**Case 2.**

### 12. Statuscode `color`

**Frontend**: `src/features/statuscode/statuscode/schemas.ts:63-66`,
`statuscodeFormSchema = v.object({...v.omit(vStatuscodeRequest,
['code_type']).entries, color: v.pipe(v.string(), v.minLength(1),
v.maxLength(7))})`. The `minLength(1)` and `maxLength(7)` are the generated
entry's own; the change is the `nullish` coming off.

**Generated**: `color: v.nullish(v.pipe(v.string(), v.minLength(1),
v.maxLength(7)))` — `valibot.gen.ts:9322` in `vStatuscodeRequest`, `:7493` in
`vPatchedStatuscodeRequest`.

**Reality**: the column is nullable because statuscodes are also created by
the backend itself (the `settings_key` ones) and by the mobile trip flow,
neither of which picks a colour. A statuscode a user creates on this form is
drawn on the dispatch board, and one without a colour is invisible there —
the legacy form required it (vuelidate `required`) for that reason, and the
converted form keeps the rule.

**Backend change**: none.

**Case 2.**

## Owed by the backend

The first kind: the contract is off, and the frontend is working around it
rather than adding a rule. Each of these is a backend change first; the
frontend workaround is deleted when it lands. **Currently empty.**

## Paid

What was asked here and has since landed in the schema, kept so the history
of a form's rule is followable. The frontend workaround each describes is
gone.

- **Customer money currencies** — `call_out_costs_currency` and its three
  siblings were read-only on the response and absent from the requests,
  while the financials panel wrote them. Now `v.optional(vCurrencyEnum)` on
  `CustomerCreateRequest`, `PatchedCustomerRequest` and the response alike;
  the form's values carry them as ordinary request fields and the panel's
  write is real.
- **`user_id` on the account requests** — a string on
  `VerifyRegistrationRequest`, an integer on `SendResetPasswordLinkRequest`
  and `ResetPasswordRequest`. Now an integer on all three;
  `src/features/account/link-params.ts` parses the emailed id as a number
  once. (The *response* components `VerifyRegistration` and `ResetPassword`
  say string and will stay so: those endpoints belong to a third-party
  library that echoes what it was given as a string. Nothing on the frontend
  reads them, so the specs stub a conforming response.)
- **Phone numbers without a format** — a bare `maxLength` on the student
  and engineer `mobile` and the customer `tel` and `mobile`. Now every one
  carries the E.164 regex, with a blank alternative wherever the field is
  optional (`/^$|^\+[1-9]\d{7,14}$/`) and none on the registration's
  required mobile. The forms normalize what the user typed to that shape at
  the wire (`src/features/forms/phone.ts`); an untouched one rides blank. The
  frontend's own E.164 pattern is gone.
- **A registration serializer of its own** — `POST /accounts/register/` took
  the staff form's `StudentUserWriteRequest`, so the registration's required
  profile lived only in the form (this was entry 12). Now
  `StudentUserRegisterRequest`: no username (the backend derives it from the
  email), no password, and `street`, `house_number`, `postal`, `city`,
  `info` and `mobile` required. `registration.ts` binds the generated body
  with no rule of its own.

## What is not on that list, and why

Three kinds of hand-written rule are deliberately absent:

- **The shared password rules** (`src/features/forms/password-rules.ts`) are
  one rule serving the seven user forms and the account set-password form.
  Only the set-password copy is form-specific and listed.
- **`src/features/account/link-params.ts`** parses the emailed link's query
  string, not a form's values.
- **Shaping** (`'' → null`, `'' → absent`) adapts form state to the generated
  entry instead of tightening it.
- **Read-only companions the form only shows** — an engineer's
  `hourly_rate_currency`, a member's logo URLs (files on the write, URLs on
  the read) — are read off the wrapper's `record`, or left off the form's
  values, rather than carried and stripped. The schemas are right about them.
- **`StudentSubWriteRequest.contract_hours_week`** is a decimal *string*;
  the legacy registration sent the number `0`. The schema is right and the
  legacy body was wrong — the strict API seam is what surfaced it.
- **Phone normalization** (`src/features/forms/phone.ts`) is shaping, not a
  rule: the generated `mobile` entries carry the E.164 regex, and the
  normalizer produces what that regex checks from whatever the user typed.

## The general rule

When a form needs a rule the schema does not have, ask which of these it is:

1. **The API is laxer than it should be**, or otherwise off → fix the
   serializer, regenerate, delete the frontend workaround, and move the entry
   from "Owed by the backend" to "Paid". Nothing is in that state now.
2. **The API must be lax, the form need not be** → keep it in the form, with a
   comment saying why the API cannot help, and add it above. **All twelve
   numbered rules are this case.**

There is no third case where redeclaring a generated entry is the answer.
`v.pipe(entries.x, ...)`, `v.unwrap(entries.x)` and `v.required(schema, keys)`
all add a rule while keeping whatever codegen put underneath; a redeclared
entry throws it away.
