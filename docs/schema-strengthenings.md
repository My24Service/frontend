# Strengthenings still carried by the frontend

Date: 2026-09-10. Reconciled against the generated schemas as they stand after
`d0c559f5` ("Retire the strengthenings the backend fix made redundant").

## What this is

A form in a converted Slice parses the generated valibot request schema and
sends the parse output (ADR-0003). Eleven places in `src/features/` still add a
rule the generated schema does not carry. Each one is the same statement:
*this form requires something the API says is optional*. Where that is true,
the API is the thing that is wrong — a payload the form would refuse is a
payload the endpoint accepts, and some of them are a 500 rather than a 400.

Two of the rules this document was first written for were that kind, and both
were fixed on the backend and deleted here on 2026-09-10 — they are recorded
below under "The two the API was wrong about", because the reasoning is the
expensive part and it should not have to be re-derived. The eleven that remain
are all the second kind: the API must stay lax about them and the form need
not be.

The list is short because most strengthenings were already redundant.
`COMPONENT_SPLIT_REQUEST` (added to `SPECTACULAR_SETTINGS` in 2026-09) makes
drf-spectacular emit `minLength: 1` on the request side of every CharField
that is not `allow_blank` — see `AutoSchema._get_serializer_field_meta`. The
`minLength(1)` workarounds ADR-0003 introduced predate it; 20 of the 34
overrides in `src/features/*/schemas.ts` were removed in this pass because the
generated schema had come to say the same thing.

Every entry below quotes the generated line it was checked against
(`src/api/valibot.gen.ts:line`), so "the generated schema does not already say
this" is checkable rather than asserted.

## The two the API was wrong about — fixed, deleted here

### User `email`, `first_name`, `last_name` — six serializers

**Frontend, then**: `src/features/user/user-form.ts`, `requiredIdentity()`,
applied by the sales, planning and customer user forms.

**Frontend, now**: the helper does not exist. `src/features/user/user-form.ts`
holds the shared identity interface, the copy, the username probe and the
password composition, and no identity schema at all —
`grep -rn requiredIdentity src/` returns nothing. Each role schema now passes
the generated component and adds no identity rule of its own —
`vSalesUserRequestWritable`, `vPlanningUserRequestWritable`,
`vCustomerUserRequestWritable`, `vEmployeeUserRequestWritable`,
`vStudentUserWriteRequestWritable`, `vEngineerRequestWritable`.

**Generated, then**: `email`, `first_name` and `last_name` were
`v.optional(...)` on `SalesUserRequest`, `PlanningUserRequest` and
`CustomerUserRequest`, because Django's `auth.User` has `blank=True` on all
three.

**Generated, now**: all three required on every one of the six user requests.
`vSalesUserRequest` (`valibot.gen.ts:9061, :9066, :9067`),
`vPlanningUserRequest` (`:7807, :7812, :7813`) and `vCustomerUserRequest`
(`:1830, :1835, :1836`) each carry
`email: v.pipe(v.string(), v.email(), v.minLength(1), v.maxLength(254))` and
`first_name: v.pipe(v.string(), v.minLength(1), v.maxLength(150))` /
`last_name` the same. `vCustomerUserRequestWritable` (`:12959`),
`vPlanningUserRequestWritable` (`:15596`) and `vSalesUserRequestWritable`
(`:16072`) match.

**Reality**: `PlanningUserSerializer.create()` (and its siblings) do
`models.PlanningUser.objects.create(username=validated_data['username'],
email=validated_data['email'], ...)`. A POST without `email` is a `KeyError`
inside `create()` — a 500, not a validation error. Every one of these forms has
required all three since the Vuelidate era.

**Correction to this document's first draft**: only `email` would have 500'd.
`first_name` and `last_name` use `.get(..., '')`; they were required because
the forms have always required them, not because of a crash.

**Backend change (done)** — `apps/company/serializers.py`, on each of the
**six** user serializers, create direction only:

```python
extra_kwargs = {
    'password': {'write_only': True, 'required': False},
    'email': {'required': True, 'allow_blank': False},
    'first_name': {'required': True, 'allow_blank': False},
    'last_name': {'required': True, 'allow_blank': False},
}
```

Create direction only is not an oversight: every one of the six uses
`.get(..., instance.x)` on update, so tightening PATCH would have blocked
partial updates.

**Blast radius**: this was the one entry on the list that tightens a contract
other clients hold. The Flutter apps generate from the same schema, and these
three fields become required on those request bodies. Worth confirming they
already send all three (they must, or they were triggering the 500 above).

**Retired by** `d0c559f5`. **Deleted here**: `requiredIdentity` from
`src/features/user/user-form.ts` and the spread in the three role schemas. It
had also become a live bug once the fields were required: `v.unwrap` returns
`schema.wrapped`, which is `undefined` for a schema that is not wrapped, so
the three user forms built object schemas with three undefined entries — a
throw inside `safeParse` rather than at import, which is why it read as the old
circular-import failure. Deleting the helper is the whole fix.

### Customer `country_code` on create

**Frontend, then**: `src/features/customer/customer/schemas.ts`,
`v.pipe(entries.country_code, v.minLength(1))` on `customerCreateSchema`
only.

**Frontend, now**: gone. `customerCreateSchema` is
`v.object({...vCustomerCreateRequest.entries, customer_id:
requiredCustomerId(vCustomerCreateRequest.entries)})` — `country_code` is the
generated entry, untouched. The file's header comment records why it needed the
pipe and no longer does.

**Generated, then**: a bare `v.string()`. `CustomerCreateSerializer.country_code`
is `schema_utils.tenant_choice_field()` whose choices are loaded per tenant in
`__init__`, so introspection saw no `choices` and no `allow_blank=False`.

**Generated, now**: `country_code: v.pipe(v.string(), v.minLength(1),
v.maxLength(2))` in `vCustomerCreateRequest` (`valibot.gen.ts:1370`), and
`country_code: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(2)))`
in `vPatchedCustomerRequest` (`:6701`). The patched component got both bounds
and needed nothing either way.

**Backend change (done)**: a `TenantCountryField` in
`apps/core/schema_utils.py` carrying `minLength: 1, maxLength: 2`, applied to
the country-code call sites (customer create and update, supplier, the order
mixin). Deliberately **not** applied to `order_type`, which shares the helper
but is a `max_length=30` column whose values vary by tenant: `maxLength: 2`
there would have been a false tightening, and the generated file confirms it
did not happen — `order_type: v.nullish(v.pipe(v.string(), v.maxLength(30)))`
(`:5044`, `:5279`, `:5413`, `:5458`), untouched by `d0c559f5`.

**Note**: this was the same class of bug as the `Blob | File` one fixed on
2026-09-10 — a custom field whose schema is inferred from its base class rather
than from what it accepts.

**Retired by** `d0c559f5`. **Deleted here**: the `minLength(1)` pipe on
`customerCreateSchema`.

## Kept, because the API must stay lax

### 1. Customer `customer_id`

**Frontend**: `src/features/customer/customer/schemas.ts:26-28`,
`requiredCustomerId()`, spread into both `customerFormSchema` and
`customerCreateSchema` (`:30-41`). Piped onto the generated entry rather than
redeclared, so its `maxLength(100)` stays where codegen puts it.

**Generated**: `customer_id: v.nullish(v.pipe(v.string(), v.maxLength(100)))`
— `valibot.gen.ts:1380` in `vCustomerCreateRequest`, `:6711` in
`vPatchedCustomerRequest`.

**Reality**: raised as a case-1 candidate and **rejected on production data**:
294 of 22,800 customers across the tenants have a blank or null `customer_id`
(ritehite 87; kms 59, of which 15 are true nulls), and members with
`customer_id_autoincrement` create customers without one deliberately. The
column cannot be tightened without either losing those rows or inventing a
value for them, so the rule belongs to the form.

**Blast radius**: none — nothing about the contract changes.

**Backend change**: none. The `UniqueTogetherValidator` that includes
`customer_id` therefore has a hole in it. That is pre-existing server-side
behaviour and a separate question from this form.

**Case 2.**

### 2. Customer patch: which fields must be present

**Frontend**: `src/features/customer/customer/schemas.ts:30-36`,
`customerFormSchema = v.required(v.object({...vPatchedCustomerRequest.entries,
customer_id: …}), ['name', 'address', 'postal', 'city', 'country_code'])`.
`v.required` lifts the optional off five named entries and keeps whatever
codegen put underneath each one.

**Generated**: all five are `v.optional(...)` on `vPatchedCustomerRequest` —
`valibot.gen.ts:6697` `name`, `:6698` `address`, `:6699` `postal`,
`:6700` `city`, `:6701` `country_code`.

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
(`valibot.gen.ts:3701`) — `MaintenanceContract.name` is
`CharField(max_length=255, blank=True, null=True)`.

**Reality**: raised as a case-1 candidate and **rejected on production data**:
5 of the 9 contracts on stormy have no name, so the column cannot be tightened
without losing them. The form requires a contract name and always has.

**Backend change**: none.

**Case 2.**

### 4. Maintenance equipment `equipment`

**Frontend**: `src/features/customer/maintenance-contract/schemas.ts:90`,
`equipment: v.unwrap(vMaintenanceEquipmentRequest.entries.equipment)`, and
again as the row check at `:157` in `equipmentRowErrors`.

**Generated**: `equipment: v.nullish(v.pipe(v.number(), v.integer()))`
(`valibot.gen.ts:3736`), beside `equipment_name: v.pipe(v.string(),
v.minLength(1), v.maxLength(255))` (`:3737`).

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
v.minValue(0), v.maxValue(2147483647)))` (`valibot.gen.ts:3738`). Note the
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

**Frontend**: `src/features/member/member/schemas.ts:19`,
`companycode: v.pipe(vMemberMemberCreateBody.entries.companycode,
v.minLength(2))` in `memberFormSchema`. Piped onto the generated entry rather
than redeclared, so the `maxLength(30)` and any later addition upstream still
apply.

**Generated**: `companycode: v.pipe(v.string(), v.minLength(1),
v.maxLength(30))` — `valibot.gen.ts:4189` in `vMemberRequest`, which
`vMemberMemberCreateBody` aliases at `:20223`.

**Reality**: the code is the tenant's subdomain label (`MemberForm.vue` prints
`[companycode].my24service.com` under the field), and the legacy form demanded
the two characters on edit as well as create, so the minimum belongs to the form
and not to the column. The API accepts one character; signup has always demanded
two.

**Backend change**: none. A product rule, not a contract gap.

**Case 2.**

### 7. Member `requireLogo` — the create flow only

**Frontend**: `src/features/member/member/schemas.ts:137-148`,
`validateMemberForm(values, {requireLogo})`. The rule is the
`if (requireLogo && !values.companylogo)` branch at `:143`, beside the parse
rather than piped onto an entry: it is conditional on which flow is calling, and
a schema cannot carry a condition that is not a property of the request.

**Generated**: `companylogo: v.nullish(v.string())` — `valibot.gen.ts:4203`
in `vMemberRequest` (`vMemberMemberCreateBody`, `:20223`).

**Reality**: signup cannot finish without an uploaded logo, so the create flow
passes `isCreate` through as `requireLogo`. A member record without a logo is
ordinary data — the endpoint is right to accept one — so this is a product rule
about the signup screen, not a gap in the contract.

**Backend change**: none.

**Case 2.**

### 8. API user `api_user.expire_start_dt`

**Frontend**: `src/features/user/api/schemas.ts:98-104`, `apiUserFormSchema`,
with `expire_start_dt: v.pipe(v.unwrap(vApiUserSubRequest.entries.expire_start_dt),
v.minLength(1))` at `:102`. `payloadOf` leaves the key absent when the date
input is cleared, so the strengthened entry refuses it instead of an
unparseable string riding the wire.

**Generated**: `expire_start_dt: v.optional(v.pipe(v.string(),
v.isoTimestamp()))` (`valibot.gen.ts:223`). `vApiUserSubRequest` requires only
`name` (`:222`) and `expire_in_days` (`:224`).

**Reality**: a token without a start has no validity window to display — an
absent start degrades the list's "Valid until" cell rather than failing the
request, so the endpoint stays permissive and the form demands the date. The
legacy model prefilled today, so no converted flow has ever sent one absent.

**Backend change**: none.

**Case 2.**

### 9. Engineer `preferred_location`

**Frontend**: `src/features/user/engineer/schemas.ts:142-144`, in
`validateEngineerUserForm` — a form-level check beside the parse, like the
password rules in `../user-form.ts`, not a redeclared entry, so codegen keeps
everything underneath.

**Generated**: `preferred_location: v.nullish(v.pipe(v.number(), v.integer()))`
— `valibot.gen.ts:13169` in `vEngineerRequestWritable` (and `:2225`,
`:2256` on the read/response components).

**Reality**: existing engineers predate the field, so null is real stored data
and the endpoint must keep accepting it. The form will not save without one, as
the legacy form would not.

**Backend change**: none.

**Case 2.**

### 10. Reset-link `email`

**Frontend**: `src/features/account/schemas.ts:29`,
`sendResetLinkSchema = v.required(vAccountsSendResetPasswordLinkCreateBody,
['email'])`. `v.required` rather than a redeclared entry: it lifts the optional
off and keeps the generated `minLength(1)` underneath.

**Generated**: `email: v.optional(v.pipe(v.string(), v.minLength(1)))`
(`valibot.gen.ts:9094`), beside `user_id: v.optional(v.pipe(v.number(),
v.integer()))` (`:9093`) and `isRegistration` (`:9092`).

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
`signature` and `password` (`valibot.gen.ts:8886-8891`). There is no
`password2` entry to constrain, and `account/schemas.ts` does not restate
`password`: the generated entry already requires a non-blank one
(`:8890`).

**Reality**: the confirmation never rides the wire, so no request schema can
hold it. That is what makes it a client-only field rather than a contract gap.

**Backend change**: none.

**Case 2.**

## What is not on that list, and why

Three kinds of hand-written rule are deliberately absent:

- **The shared password rules** (`src/features/forms/password-rules.ts`) are
  one rule serving the seven user forms and the account set-password form, so
  they are documented where they live rather than repeated per form. Only the
  copy above is form-specific and listed. They were hoisted out of
  `user-form.ts` so the two families cannot drift apart.
- **`src/features/account/link-params.ts`** parses the emailed link's query
  string, not a form's values. Its `user_id` and `signature` entries restate
  the request entries they feed, and only its `timestamp` check is stricter,
  guarding an untyped URL — not a form.
- **Shaping** (`'' → null`, `'' → absent`) is not a strengthening either: it
  adapts form state to the generated entry instead of tightening it.

## The general rule

When a form needs a rule the schema does not have, ask which of these it is:

1. **The API is laxer than it should be** → fix the serializer, regenerate,
   delete the frontend rule. This list is currently **empty**; the two entries
   that were on it were fixed on the backend the same day they were written
   down, and are recorded above.
2. **The API must be lax, the form need not be** → keep it in the form, with a
   comment saying why the API cannot help, and add it above. **All eleven
   surviving rules are this case.**

Deciding between them takes evidence, not reasoning. Three of the four
candidates this document's first draft raised as case 1 were settled by counting
production rows, and two of those went the other way than the code alone
suggested — `customer_id` and the contract `name` are columns with real null
rows, not contracts that were merely too loose.

There is no third case where redeclaring a generated entry is the answer.
`v.pipe(entries.x, ...)`, `v.unwrap(entries.x)` and `v.required(schema, keys)`
all add a rule while keeping whatever codegen put underneath; a redeclared
entry throws it away, which is how the username charset rule went missing from
three forms for a whole Slice.
