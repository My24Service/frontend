# Form schemas in a Slice

How a form validates. Read this before writing a `schemas.ts`, and
before adding a rule to one that exists.

The generated valibot request schema is the form's validator (ADR-0003).
Redeclaring an entry
(`name: v.pipe(v.string(), v.minLength(1))`) instead of using or extending the
generated one drops the rules codegen already carries — maxima, formats,
regexes, enums — and every rule added upstream after you wrote it. The steps below
make that move unnecessary.

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

### 5. Put the labels in `FIELD_LABELS`

A field's label is copy like any other, and it sits beside its messages:

```ts
export const FIELD_LABELS = {
  address: () => $trans('Address'),
  vat_number: () => $trans('VAT number'),
} satisfies FieldLabels<keyof MemberFormValues & string>
```

The keys are the form's own field names, so a label for a field that does not
exist does not compile. Every label is written out as a `$trans(...)` literal:
the page's catalogue is built by scanning the source for those literals, so a
label conjured from the field name at runtime — `$trans('City')` derived from
`city` — never enters the catalogue and reads English in a Dutch UI.

**Done when**: every field a `ValidatedFormField` renders has a label here, and
no label is spelled at a call site except where a caller overrides one.

### 6. Derive the form-values type

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

### 7. Classify what survived

Each rule still hand-written after step 3 is one of two things, and each gets
a comment saying which:

1. **The API is laxer than it should be.** A payload the form refuses is a
   payload the endpoint accepts — sometimes a 500 rather than a 400. Record it
   in `docs/schema-strengthenings.md` as case 1, with the serializer change it
   needs, and settle it with evidence: count production rows before deciding
   the code alone says a value should not exist.
2. **The API must be lax, the form need not be.** A cross-field rule, a
   client-only field, a product rule the API has no opinion about, a column
   that must stay nullable for a reason unrelated to this form. Record it in
   `docs/schema-strengthenings.md` as case 2.

**Done when**: every rule in the file is one of those two, in writing.

#### The ledger

The ledger is `docs/schema-strengthenings.md`. That document is the single
record of every hand-written rule the Slices still carry: the file and
function it lives in, the generated entry it was checked against, whether the
API must stay lax about it or was simply too loose, and the backend change that
would retire it. It is not duplicated here — this file is the procedure, that
one is the record.

Case 1 is empty today. All fifteen surviving rules are case 2.

### The form a field is written into

`ValidatedForm` hands down the four facts every field of one form repeats — the
id's prefix, the values object, the errors, the copy — so a field names itself
and nothing else:

```vue
<ValidatedForm
  name="member"
  v-model="member"
  :errors="errors"
  :messages="FIELD_MESSAGES"
  :labels="FIELD_LABELS"
  :submitted="submitClicked"
>
  <ValidatedFormField name="address" />
  <ValidatedFormField name="contacts" textarea />
</ValidatedForm>
```

A field derives `id` as `<form name>_<field>`, `value` as `values[field]`,
`error` as `errors[field]`, its placeholder as `FIELD_MESSAGES[field]()` and its
label as `FIELD_LABELS[field]()`. Anything passed explicitly wins over the
derived value, and that is how the exceptions are said: `id` where the id is not
the field's name, `label` where the caller overrides it, and `type`,
`textarea`, `rows`, `autofocus` and `label-cols` for the field that is not a
plain one. Both components live in `src/features/forms/`; `MemberForm.vue` is
the reference.

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
three copies: `src/features/user/user-form.ts` holds the identity fields and
the copy for the sales, planning, customer, engineer, employee, student and
API-user forms. The password rule all seven share with the account form lives
one level down in `src/features/forms/password-rules.ts`, which neither family
may import from the other to reach.

## Worked examples

- `src/features/member/module/schemas.ts` — the whole file, 40 lines, no
  strengthening at all.
- `src/features/user/sales/schemas.ts` with `../user-form.ts` — seven forms on
  one shared base, parsing the generated component directly, sharing the
  rules the schema cannot carry (password confirmation, the probe verdict).
- `src/features/customer/customer/schemas.ts` — piping and `v.required` on a
  create/patch pair, with the read-only companions named.
