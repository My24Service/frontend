# Form schemas in a Slice

How a converted form validates. Read this before writing a `schemas.ts`, and
before adding a rule to one that exists.

The generated valibot request schema is the form's validator (ADR-0003). This
document is about the gap between that decision and what the last eight
conversions actually produced: eleven `schemas.ts` files, 34 hand-written
field rules, of which 20 were **restatements** — a rule the generated schema
already carried — and 3 were **downgrades** — a rule that replaced a generated
pipe and dropped part of it. Three forms silently stopped enforcing the
username charset the API enforces, for a whole Slice, because of one of those.

Both come from the same move: **redeclaring** an entry
(`name: v.pipe(v.string(), v.minLength(1))`) instead of using or extending the
generated one. The steps below are arranged to make that move unnecessary.

## The steps

### 1. Read the entry before you write a rule

For every field the form validates, open `src/api/valibot.gen.ts` and read the
entry on the request component. `COMPONENT_SPLIT_REQUEST` is on in the Django
settings, so the request direction of every CharField that is not
`allow_blank` already carries `minLength(1)`, alongside the maxima, the
`email` and `url` formats, the decimal and charset regexes, and the enums.

**Done when**: every field the form will validate has been read in
`valibot.gen.ts`, and you can say for each one what the schema already
enforces.

Most rules you were about to write are already there. The eight conversions
before this one wrote theirs against a schema that predated the split, or
copied them from a sibling that did.

### 2. Parse the request component

Three names look similar and are different artifacts:

| Const | What it is |
| --- | --- |
| `vFooRequest` | the request body. Parse this. |
| `vFooRequestWritable` | the request body when it has read-only keys of its own (the user endpoints). Parse this. |
| `vFooWritable` | the **response** shape with its read-only keys dropped. Carries no request-direction required-ness. |

The annotation block above each const says which endpoints use it — the
`npm run codegen` step writes them. `Request body:` is the one you want.

**Done when**: the schema the form parses is named in that annotation as the
request body of the endpoint the form submits to.

Use that const by its generated name everywhere — the components, the specs,
this file. A local `export const fooFormSchema = vFooRequest` is a rename that
hides which component is in play and has to be followed to be understood. A
name of your own is earned by composition (`v.required(...)`, an object that
spreads entries and adds one), not by assignment.

### 3. Add a rule by piping onto the entry

When step 1 shows a rule genuinely missing, extend the generated entry rather
than replacing it:

| Need | Move |
| --- | --- |
| an extra check | `v.pipe(vFoo.entries.x, v.minLength(2))` |
| optional → required | `v.required(vFoo, ['a', 'b'])` |
| nullish → required | `v.unwrap(vFoo.entries.x)` |
| both | `v.pipe(v.unwrap(vFoo.entries.x), v.minLength(1))` |

Each of these keeps whatever codegen put underneath, so the next `npm run
codegen` moves the form with the API. A redeclared entry throws it away, and
throws away every rule added upstream after you wrote it.

**Done when**: no entry in the file names a base type (`v.string()`,
`v.number()`) that codegen already named.

### 4. Put the copy in `FIELD_MESSAGES`

Attaching `$trans(...)` to a rule is the most common reason a form redeclares
an entry it did not need to. Messages live outside the schema:

```ts
export const FIELD_MESSAGES = {
  name: (issue) => issue?.type === 'max_length'
    ? MESSAGES.name_max_length()
    : MESSAGES.name_required(),
  module: MESSAGES.module_required,
} satisfies FieldMessages<keyof ModuleFormValues & string>

export function validateModule(values: ModuleFormValues): ModuleFieldErrors {
  return fieldErrors(vMemberModuleCreateBody, values, FIELD_MESSAGES)
}
```

`fieldErrors` lives in `src/features/forms/validation.ts` and maps parse
issues to one message per field. A message reads `issue.type` when blank and
too-long need different words, and answers for `undefined` because the
templates call it with no argument to show the same line as a hint.

**Done when**: `validate*` is one call to `fieldErrors`, and the file contains
no hand-rolled loop over `result.issues`.

### 5. Derive the form-values type

`v.InferInput<typeof schema>` is the form's state type. Name only the parts
that genuinely differ from the wire:

```ts
// a picker that is empty rather than absent until chosen
export type ModulePartFormValues =
  Omit<v.InferInput<typeof vMemberModulePartCreateBody>, 'module'>
  & {module: number | null}

// read-only companions the record carries in and the parse drops again
export type CustomerFormValues = v.InferInput<typeof vPatchedCustomerRequest> & {
  id?: number
  num_orders?: number
}
```

The parts that legitimately differ are `number | null` for "not picked yet",
client-only fields (`password1`/`password2`, `storedFile`), a display value
beside its wire value (`tariff_dinero`), and read-only fields the view shows.
Everything else comes from `InferInput`.

**Done when**: every field in the type is either inferred or has a comment
saying why the form holds it differently from the wire.

### 6. Classify what survived

Each rule still hand-written after step 3 is one of two things, and each gets
a comment saying which:

1. **The API is laxer than it should be.** A payload the form refuses is a
   payload the endpoint accepts — sometimes a 500 rather than a 400. Record it
   in the ledger below as case 1, with the serializer change it needs, and
   settle it with evidence: the candidates raised so far were mostly rejected by
   counting production rows that the code alone said should not exist. Where the
   count held up, the serializer was tightened and the rule stopped being a
   strengthening — `country_code` in the customer slice is the worked example,
   its `minLength(1)` now coming from codegen
   (`src/features/customer/customer/schemas.ts`).
2. **The API must be lax, the form need not be.** A cross-field rule, a
   client-only field, a product rule the API has no opinion about, a column
   that must stay nullable for a reason unrelated to this form. Record it in the
   ledger below as case 2.

**Done when**: every rule in the file is one of those two, in writing.

#### The ledger

Every hand-written rule that survived the switch to the generated request
schema, across the fourteen `schemas.ts` files in `src/features/*/` and
`src/features/*/*/`. Each entry quotes the generated entry it is piped onto or
checked beside (`src/api/valibot.gen.ts:line`), so "the generated schema does
not already say this" is checkable rather than asserted. Eleven rules survive,
all eleven of them case 2: none is waiting on a serializer change, which is what
ADR-0003's update means by "the set the API cannot hold on a form's behalf".
Case 1 has no survivor today — the candidates that were the API's fault were
fixed on the backend the same day they were raised.

**member — `src/features/member/member/schemas.ts`**

- `:19` `companycode` must be at least two characters, piped onto the entry
  rather than redeclared. Generated: `companycode: v.pipe(v.string(),
  v.minLength(1), v.maxLength(30))` (`valibot.gen.ts:4189`). **Case 2, a
  product rule.** The code is the tenant's subdomain label (`MemberForm.vue`
  prints `[companycode].my24service.com` under the field), and the legacy form
  demanded the two characters on edit as well as create, so the minimum belongs
  to the form and not to the column.
- `:143` the create flow refuses a member without a logo
  (`requireLogo`, passed as `isCreate`). Generated:
  `companylogo: v.nullish(v.string())` (`valibot.gen.ts:4203`). **Case 2, a
  product rule.** Signup cannot finish without an uploaded logo; a member record
  without one is ordinary data, so the endpoint stays permissive and the form
  holds the rule.

**customer — `customer/customer/schemas.ts` and
`customer/maintenance-contract/schemas.ts`**

- `customer/customer/schemas.ts:28` `customer_id` is required and non-blank on
  both the create and the patch schema. Generated, both directions:
  `customer_id: v.nullish(v.pipe(v.string(), v.maxLength(100)))`
  (`valibot.gen.ts:1380`, `:6711`). **Case 2, a column that must stay nullable
  for an unrelated reason**: 294 of 22,800 customers across the tenants have no
  customer_id, and members with `customer_id_autoincrement` create customers
  without one on purpose.
- `customer/customer/schemas.ts:30` the patch schema names
  `['name', 'address', 'postal', 'city', 'country_code']` as required. Generated:
  all five are `v.optional(...)` (`valibot.gen.ts:6697-6701`). **Case 2, the API
  must be lax**: PATCH has to accept a partial body; this form never submits one,
  so it refuses what the endpoint would accept.
- `customer/maintenance-contract/schemas.ts:29` `name` is required and
  non-blank. Generated: `name: v.nullish(v.pipe(v.string(), v.maxLength(255)))`
  (`valibot.gen.ts:3701`). **Case 2, a column that must stay nullable for an
  unrelated reason**: 5 of the 9 contracts on stormy have no name, so the column
  cannot be tightened without losing them.
- `customer/maintenance-contract/schemas.ts:90` an equipment row must name an
  equipment (`v.unwrap`, and again as the row check at `:155`). Generated:
  `equipment: v.nullish(v.pipe(v.number(), v.integer()))`
  (`valibot.gen.ts:3736`). **Case 2, a column that must stay nullable**: the FK
  is `null=True, blank=True` and the row is meaningful without it — it carries
  its own `equipment_name` on the same component (`valibot.gen.ts:3737`) — so
  the endpoint keeps accepting an unlinked row and the form refuses one.
- `customer/maintenance-contract/schemas.ts:158` a filled frequency must be a
  positive number. Generated:
  `times_per_year: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0),
  v.maxValue(2147483647)))` (`valibot.gen.ts:3738`). **Case 2, a product rule the
  API has no opinion about**: a stored 0 is representable and the column allows
  it; a schedule of zero visits a year is not something this form will save.

**user — `user/api/schemas.ts` and `user/engineer/schemas.ts`**

- `user/api/schemas.ts:98` `api_user.expire_start_dt` is required. Generated:
  `expire_start_dt: v.optional(v.pipe(v.string(), v.isoTimestamp()))`
  (`valibot.gen.ts:223`). **Case 2, a product rule**: an absent start degrades
  the list's "Valid until" cell rather than failing the request, so the endpoint
  stays permissive and the form demands the date.
- `user/engineer/schemas.ts:142` `preferred_location` must be picked. Generated:
  `preferred_location: v.nullish(v.pipe(v.number(), v.integer()))`
  (`valibot.gen.ts:13169`). **Case 2, a column that must stay nullable for an
  unrelated reason**: existing engineers predate the field, so the endpoint keeps
  accepting null while the form will not save without one.

**account — `src/features/account/schemas.ts`**

- `:26` the reset-link form requires an `email`. Generated:
  `email: v.optional(v.pipe(v.string(), v.minLength(1)))`
  (`valibot.gen.ts:9094`), beside `user_id: v.optional(...)`
  (`valibot.gen.ts:9093`). **Case 2, the API must be lax**: the endpoint takes
  either an email or a user_id, so it cannot require either; this form only ever
  sends the email, so it does.
- `:64` set-password confirms `password2` against `password1` and refuses a
  blank `password1`. Generated: `vResetPasswordRequest` carries `user_id`,
  `timestamp`, `signature` and `password` (`valibot.gen.ts:8886-8891`) and
  has no `password2` entry to constrain. **Case 2, a client-only field**: the
  confirmation never rides the wire, so no schema can hold it.

Two kinds of hand-written rule are deliberately absent from that list. The shared
password rules (`src/features/user/user-form.ts`) are one rule serving seven
forms, so they are documented where they live rather than per form — only the
account copy above is form-specific and listed. And
`src/features/account/link-params.ts` parses the emailed link's query string,
not a form's values: its `user_id` and `signature` entries restate the request
entries they feed, and only its `timestamp` check is stricter, guarding an
untyped URL. Shaping (`'' → null`, `'' → absent`) is not a strengthening
either: it adapts form state to the generated entry instead of tightening it.

## What the file ends up containing

For a straightforward form, all of it:

```ts
export type ModuleFormValues = v.InferInput<typeof vMemberModuleCreateBody>
export function emptyModule(): ModuleFormValues { return {name: ''} }
// + FIELD_MESSAGES, validateModule, parseModule
```

No schema is declared, because there is nothing to declare: the form parses
`vMemberModuleCreateBody` and the file holds the blank-form default, the copy
and the two functions.

If a form needs no strengthening, no per-field copy and no extra state, it
needs no `schemas.ts` at all: import the generated schema in the component and
parse it there. `src/features/customer/document/` is the example — its file
holds one type and nothing else.

Where three forms share a shape, the shared half is a module beside them, not
three copies: `src/features/user/user-form.ts` holds the identity fields, the
password rules and the copy for the sales, planning and customer user forms,
which differ only in their role sub-object.

## Worked examples

- `src/features/member/module/schemas.ts` — the whole file, 40 lines, no
  strengthening at all.
- `src/features/user/sales/schemas.ts` with `../user-form.ts` — three forms on
  one shared base, parsing the generated component directly, sharing the
  rules the schema cannot carry (password confirmation, the probe verdict).
- `src/features/customer/customer/schemas.ts` — piping and `v.required` on a
  create/patch pair, with the read-only companions named.
