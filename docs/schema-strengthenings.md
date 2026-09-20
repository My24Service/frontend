# Strengthenings still carried by the frontend

## What this is

A form in a Slice parses the generated valibot request schema and
sends the parse output (ADR-0003). Six places in `src/features/` still add
a rule the generated schema does not carry. Each one is the same statement:
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

### Column versus serializer

The request schema is generated from the **serializer**, not from the
column. `COMPONENT_SPLIT_REQUEST` is on, so the request direction of a field
can be stricter than the column and the response: `extra_kwargs = {'name':
{'required': True, 'allow_blank': False, 'allow_null': False}}` refuses a
blank on write while the column keeps its stored nulls, and
`nullable_response_fields = ['name']` on the serializer (`tools/schema.py`)
keeps the *response* component honest about those nulls. "The column must
stay nullable" is therefore never by itself a reason for the form to carry a
rule — nine of the entries below were retired that way in September 2026,
see "Paid". A rule belongs to the form only when the *request* genuinely has
to accept what the form refuses: another client sends it, the rule depends
on something outside the payload, or the field never rides the wire at all.

## Kept, because the API must stay lax

### 1. Customer `customer_id`

**Frontend**: `src/features/customer/customer/schemas.ts:11-13`,
`requiredCustomerId()`, spread into both `customerFormSchema` and
`customerCreateSchema` (`:15-26`). Piped onto the generated entry rather than
redeclared, so its `maxLength(100)` stays where codegen puts it.

**Generated**: `customer_id: v.nullish(v.pipe(v.string(), v.maxLength(100)))`
— `valibot.gen.ts:1306` in `vCustomerCreateRequest`, `:6222` in
`vPatchedCustomerRequest`.

**Reality**: the rule is really "required unless the member has
`customer_id_autoincrement`", and members with that setting create customers
without one deliberately. A conditional cannot reach the schema, so the
serializer stays lax and the form — which knows the setting — carries the
rule. (294 of 22,800 customers across the tenants have a blank or null
`customer_id`; ritehite 87, kms 59.)

**Backend change**: none.

**Case 2.**

### 2. Customer edit: which fields must be present

**Frontend**: `src/features/customer/customer/schemas.ts:15-21`,
`customerFormSchema = v.required(v.object({...vPatchedCustomerRequest.entries,
customer_id: …}), ['name', 'address', 'postal', 'city', 'country_code'])`.
`v.required` lifts the optional off five named entries and keeps whatever
codegen put underneath each one.

**Generated**: all five are `v.optional(...)` on `vPatchedCustomerRequest` —
`valibot.gen.ts:6208-6212` — and each is non-blank once present.

**Reality**: the edit saves a whole customer, and the component that says
what a whole customer needs is `vCustomerCreateRequest` — but that one is a
strict *subset* of the patch body (no `branch_id`, `branch_partner`,
`maintenance_contract`, `products_without_tax`, `standard_hours_*`,
`use_branch_address`), so the edit cannot parse it the way the branch,
picture and template edits parse their create bodies. And the patch body
cannot be tightened: the Flutter app PATCHes `/customer/customer` with
partial bodies.

**Backend change**: a full-record `CustomerRequest` beside the create and
patch bodies would let the edit parse it as-is and retire this entry. Not
asked for yet: the five fields are always present on this form's body, so
the rule only ever refuses `undefined`, which nothing produces.

**Case 2.**

### 3. Member `requireLogo` — the create flow only

**Frontend**: `src/features/member/member/schemas.ts:119-130`,
`validateMemberForm(values, {requireLogo})`. The rule is the
`if (requireLogo && !values.companylogo)` branch at `:125`, beside the parse
rather than piped onto an entry: it is conditional on which flow is calling, and
a schema cannot carry a condition that is not a property of the request.

**Generated**: `companylogo: v.nullish(v.string())` — `valibot.gen.ts:3845`
in `vMemberRequest` (`vMemberMemberCreateBody`, `:19228`).

**Reality**: signup cannot finish without an uploaded logo, so the create flow
passes `isCreate` through as `requireLogo`. A member record without a logo is
ordinary data, and the same serializer serves the staff-side create, so this
is a product rule about the signup screen, not a gap in the contract.

**Backend change**: none.

**Case 2.**

### 4. Reset-link `email`

**Frontend**: `src/features/account/schemas.ts:13`,
`sendResetLinkSchema = v.required(vAccountsSendResetPasswordLinkCreateBody,
['email'])`. `v.required` rather than a redeclared entry: it lifts the optional
off and keeps the generated `minLength(1)` underneath.

**Generated**: `email: v.optional(v.pipe(v.string(), v.minLength(1)))`
(`valibot.gen.ts:8765`), beside `user_id: v.optional(v.pipe(v.number(),
v.integer()))` (`:8764`) and `isRegistration` (`:8763`).

**Reality**: the endpoint takes either a `user_id` or an `email`, so it cannot
require either — the request is valid with the other one. This form only ever
sends the email, so it requires that.

**Backend change**: none.

**Case 2.**

### 5. Account set-password confirmation

**Frontend**: `src/features/account/schemas.ts:40-42`,
`validateSetPassword` → `passwordErrors(values, {isCreate: true})`, the shared
rule in `src/features/forms/password-rules.ts`. It confirms `password2` against
`password1` and refuses a blank `password1`.

**Generated**: `vResetPasswordRequest` carries `user_id`, `timestamp`,
`signature` and `password` (`valibot.gen.ts:8582-8587`). There is no
`password2` entry to constrain, and `account/schemas.ts` does not restate
`password`: the generated entry already requires a non-blank one
(`:8586`).

**Reality**: the confirmation never rides the wire, so no request schema can
hold it. That is what makes it a client-only field rather than a contract gap.

**Backend change**: none.

**Case 2.**

### 6. Equipment/location/building: which owner is required

**Frontend**: `src/features/equipment/owner/owned-record-schemas.ts:54-60`,
the owner check in `validate`, shared by the building, location and
equipment forms. Each parses the generated variant and then adds the owner
check beside it, because the schema cannot name the field it fails on.

**Generated**: `vBuildingCreateRequestRequest` is
`v.union([vBuildingBranchCreateRequest, vBuildingCustomerCreateRequest])`
(`valibot.gen.ts:948`), i.e. `{branch, name}` (`:907`) or
`{customer, name}` (`:939`), and the same pair exists for location and
equipment. `vPatched*Request` declares both keys optional, so this is a
create-only rule.

**Reality**: two separate reasons, and both are why the rule belongs to the
form rather than to the schema.

*Which* key is required is a property of the tenant, not of the payload: the
viewset picks its serializer from `member.has_branches` inside the method
body, so the endpoint declares a plain `oneOf` with no discriminator, and the
backend's own comment says a client should "keep the pair and select per tenant
at runtime". The form does exactly that — it parses the variant
`useOwnerContext` picks — but a rule that lives in *which variant was chosen*
has no field to report on.

And whether an owner is required *at all* depends on the role: a branch employee
and a customer user are pinned to their own branch or customer by the API, which
overwrites whatever the request carried. Their forms send the key the declared
variant requires, read from `branch-my`/`customer-my`, but the user never chose
it and must not be asked to.

The failure mode this avoids is concrete: valibot reports a failed `union` as a
single root issue, so `fieldErrors` would map it to no field at all and the form
would submit a body the endpoint rejects with nothing shown to the user.

**Backend change**: none. A schema cannot express either half — the tenant
decides the variant, and the role decides whether there is a choice to make.

**Case 2.**

### 7. Assigned-order material: which picks are required

**Frontend**: `src/features/field-service/dispatch/assigned-order-material-schemas.ts`,
`validateAssignedOrderMaterial`, in the register-material form on the
`/mobile` console.

**Generated**: `vAssignedOrderMaterialRequest`
(`src/api/valibot.gen.ts`) declares `assigned_order: v.number()` and then
`material`, `location`, `amount`, `material_name`, `is_extra` all optional —
`material` and `location` nullable, `amount` a decimal **string**.

**Reality**: the optional pair is right on the write and wrong on the form.
`AssignedOrderMaterial` rows are written from two places: this register form,
where a person picks an order, a location and a material, and an inline edit
(the API user, the engineer's app) that may change only the amount and leave
the pair out. The endpoint therefore must accept a body without them, while a
registration that names neither is a movement nobody can account for. That is a
rule about the *screen's* picks, not about the payload, so it stays in the form
and reports on its own fields.

The amount is the same shape: `amount` is a string on the wire, so the form
sends the string the schema declares and refuses a blank or a zero itself —
zero is a movement of nothing, which is a rule no decimal pattern can state.

**Backend change**: none. Tightening `material`/`location` would break the
inline edit the same serializers serve.

**Case 2.**

## Owed by the backend

The first kind: the contract is off, and the frontend is working around it
rather than adding a rule. Each of these is a backend change first; the
frontend workaround is deleted when it lands. **Currently empty.**

## Paid

What was asked here and has since landed in the schema, kept so the history
of a form's rule is followable. The frontend workaround each describes is
gone.

- **Nested bodies inside a `Patched*` component were not themselves
  patched.** `PatchedEngineerRequest.engineer` referenced the full
  `EngineerSubRequest`, every required key demanded, while the endpoint took
  a partial nested body (DRF reads partiality off `root.partial`). Once
  `preferred_location` became required that made the rate-only PATCH in
  `src/features/invoice/form/use-customer-prices.ts` a type error.
  `tools/schema.py` now carries a patched parent's partiality down to its
  nested serializer fields, so the seven user PATCH bodies reference
  `Patched*SubRequest` components with no `required` list, and the call
  site sends `{engineer: {hourly_rate}}` with no cast.
- **Nine "the column is nullable" rules, retired in one pass (September
  2026).** Each had argued from the column; each was a serializer that had
  simply never been tightened, and none had a second client sending what the
  form refused (the Flutter app writes none of these endpoints). The write
  serializers now refuse what the forms refused, and where rows hold nulls
  the responses stay honest through `nullable_response_fields`. Counts are
  from the 2026-09-19 production backup, every tenant schema:
  - *maintenance contract `name`* — required, non-blank on
    `MaintenanceContractRequest`; 5 of 9 contracts on stormy have none and
    read back null.
  - *maintenance equipment `equipment`* — required, non-null on
    `MaintenanceEquipmentRequest`; the FK stays `SET_NULL`, so a row whose
    equipment was deleted reads back null.
  - *maintenance equipment `times_per_year`* — `minimum: 1` on the
    serializer; the column still allows zero, and none of the 33 rows holds
    one.
  - *member `companycode`* — `min_length=2`: the code is the tenant's
    subdomain label, which is wrong for every client at one character. The
    shortest stored code is three.
  - *engineer `preferred_location`* — required, non-null on
    `EngineerSubRequest`; 74 of 206 engineers predate the field and read back
    null.
  - *statuscode `color`* — required, non-blank on `StatuscodeRequest`. The
    "backend creates statuscodes without a colour" was `member_to_tenant`
    writing through the ORM (125 such rows across 19 tenants, which is why
    the response stays nullable), and the "mobile trip flow" is
    `TripStatuscode`, a different model; nothing but the API went through
    the serializer.
  - *partner request `to_member`* — required, non-null on
    `PartnerRequestRequest`. No row holds a null, so the response is not
    widened; the column could be made NOT NULL when convenient.
  - *import `name`* — required, non-blank on `ImportRequest` and
    `PatchedImportRequest`. No row holds a null or a blank; same as above.
  - *API user `expire_start_dt`* — nothing to change: the column defaults to
    now, so an absent start was never "no validity window", it was today. The
    form's rule was retired on that reading; the prefill stays.
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
  profile lived only in the form. Now `StudentUserRegisterRequest`: no
  username (the backend derives it from the email), no password, and
  `street`, `house_number`, `postal`, `city`, `info` and `mobile` required.
  `registration.ts` binds the generated body with no rule of its own.

## What is not on that list, and why

Kinds of hand-written rule that are deliberately absent:

- **Parsing the create body on an edit.** The branch and picture edits
  validate against `vBranchRequest` / `vPictureRequest` rather than the
  `vPatched*` twin. That is a choice of which generated const to parse, not
  a rule on top of one: the form saves a whole record, the create body is the
  component that says what a whole record needs, and the body it then
  PATCHes is a superset of what PATCH requires. It works because the two
  components have the same keys; the customer edit cannot do it (entry 2).
- **A patch body whose keys the form always sends.** The template edit and
  the company-info save parse `vPatchedTemplateRequest` /
  `vPatchedMemberRequest` as they are. Every field they care about is
  `v.optional(v.pipe(v.string(), v.minLength(1), …))` — optional, but
  non-blank once present — and the shaped body always carries the key, so a
  blank is refused with nothing lifted to required. The `v.required(...)`
  those two files used to carry only ever refused `undefined`, which nothing
  produced.
- **The shared password rules** (`src/features/forms/password-rules.ts`) are
  one rule serving the seven user forms and the account set-password form.
  Only the set-password copy is form-specific and listed.
- **`src/features/account/link-params.ts`** parses the emailed link's query
  string, not a form's values.
- **Shaping** (`'' → null`, `'' → absent`, `name.trim()`) adapts form state
  to the generated entry instead of tightening it.
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

1. **The API is laxer than it should be**, or otherwise off → tighten the
   serializer (request side; `nullable_response_fields` if the column keeps
   nulls), regenerate, delete the frontend workaround, and move the entry
   from "Owed by the backend" to "Paid". Before deciding: count the rows,
   and grep the Flutter app (`../my24-mobile`) for the endpoint — a second
   client that sends what the form refuses makes it case 2.
2. **The API must be lax, the form need not be** → keep it in the form, with a
   comment saying why the API cannot help, and add it above. **All seven
   numbered rules are this case.**

There is no third case where redeclaring a generated entry is the answer.
`v.pipe(entries.x, ...)`, `v.unwrap(entries.x)` and `v.required(schema, keys)`
all add a rule while keeping whatever codegen put underneath; a redeclared
entry throws it away.
