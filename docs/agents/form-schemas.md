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

One exception: an edit that saves the **whole record** may parse the create
body (`vFooRequest`) instead of the patch body (`vPatchedFooRequest`) when
the two have the same keys — the create body is the component that says
what a whole record needs, and the body then sent is a superset of what
PATCH requires. The branch and picture forms do this. It is a choice of
which generated const to parse, not a rule on top of one, so it is not a
strengthening. And check first whether the patch body already does the job:
a `v.optional(v.pipe(v.string(), v.minLength(1)))` entry refuses a blank
once the key is present, and a form that always sends the key needs no
`v.required` for it.

**Done when**: the schema the form parses is named in that annotation as the
request body of the endpoint the form submits to, or is the create body of a
whole-record edit whose keys match it.

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

### 4. Put the labels in `FIELD_LABELS`; write copy only where a rule cannot say it

Attaching `$trans(...)` to a rule is the most common reason a form redeclares
an entry it did not need to. Copy lives outside the schema, and most of it is
not written per form at all: `fieldErrors` answers every issue with one line
per valibot rule, with the field's label filled in — "Please enter a name",
"Please select a customer", "Please use at most 255 characters", "Please
enter a whole number", "Please enter a valid email". The templates are in
`ruleMessage` (`src/features/forms/validation.ts`), and a form hands over its
labels:

```ts
export const FIELD_LABELS = {
  name: () => $trans('Name'),
  module: () => $trans('Module'),
} satisfies FieldLabels<keyof ModulePartFormValues & string>

export function validateModulePart(values: ModulePartFormValues): ModulePartFieldErrors {
  return fieldErrors(vMemberModulePartCreateBody, values, {}, FIELD_LABELS)
}
```

A `FIELD_MESSAGES` entry is for the field whose rule cannot be read off the
issue: a time that must read `HH:mm`, a date of birth as `yyyy-mm-dd`, a
picker the values drop before the schema sees its null (so the schema cannot
tell "select" from "enter"), a uniqueness answer from the API. Build those
from the same templates where one fits — `selectMessage(FIELD_LABELS.branch())`
— so the msgid stays shared:

```ts
export const FIELD_MESSAGES = {
  start_time: () => $trans('Please enter a valid start time HH:mm'),
  branch: () => selectMessage(FIELD_LABELS.branch()),
} satisfies FieldMessages<keyof OrderFieldErrors & string>
```

A template that shows a hint under an untouched input reads it from
`PLACEHOLDERS = requiredMessages(FIELD_LABELS)`; a `ValidatedForm` derives the
same line from its labels on its own.

**Done when**: `validate*` is one call to `fieldErrors`, the file contains no
hand-rolled loop over `result.issues`, and every `FIELD_MESSAGES` entry says
something `ruleMessage` could not.

### 5. Every label is a `$trans` literal

A field's label is copy like any other, and it names the field in every rule line:

```ts
export const FIELD_LABELS = {
  address: () => $trans('Address'),
  vat_number: () => $trans('VAT number'),
} satisfies FieldLabels<keyof MemberRequest & string>
```

The keys are the form's own field names, so a label for a field that does not
exist does not compile. Every label is written out as a `$trans(...)` literal:
the page's catalogue is built by scanning the source for those literals, so a
label conjured from the field name at runtime — `$trans('City')` derived from
`city` — never enters the catalogue and reads English in a Dutch UI.

**Done when**: every field a `ValidatedFormField` renders has a label here, and
no label is spelled at a call site except where a caller overrides one.

### 6. Derive the form-values type

If the form holds the component's shape unchanged, use the generated
request type directly — a type that adapts nothing needs no name of its
own, so functions and the `useResourceForm` call sites say `ModuleRequest`:

```ts
export function emptyModule(): ModuleRequest {
  return formDefaults(vMemberModuleCreateBody)   // step 8
}
```

Otherwise `v.InferInput<typeof schema>` is the form's state type. Name only
the parts that genuinely differ from the wire:

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
   needs, and settle it with evidence: count production rows, and grep the
   Flutter app (`../my24-mobile`) for the endpoint, before deciding.
2. **The API must be lax, the form need not be.** A cross-field rule, a
   client-only field, a rule that depends on the tenant or the role rather
   than the payload, a second client that sends what the form refuses. Record
   it in `docs/schema-strengthenings.md` as case 2.

A nullable **column** is not by itself case 2. The request schema comes from
the serializer, and with `COMPONENT_SPLIT_REQUEST` its request side can
refuse a null the column still stores (`extra_kwargs` on the serializer,
`nullable_response_fields` to keep the response honest). Nine former case-2
entries turned out to be that, and were retired on the backend.

**Done when**: every rule in the file is one of those two, in writing.

#### The ledger

The ledger is `docs/schema-strengthenings.md`. That document is the single
record of every hand-written rule the Slices still carry: the file and
function it lives in, the generated entry it was checked against, whether the
API must stay lax about it or was simply too loose, and the backend change that
would retire it. It is not duplicated here — this file is the procedure, that
one is the record.

Six rules survive, all case 2; nothing is owed by the backend.

### 8. Derive the blank form; don't spell it out

`empty*()` is the one part of the file that needs no judgement per field:
the blank of a `v.nullish(...)` entry is `null`, of an array is `[]`, of a
boolean is `false`. Derive it from the request component rather than listing
it:

```ts
import { formDefaults } from '@/models/schema'

export function emptyBranch(): BranchFormValues {
  return formDefaults(vBranchRequest, {country_code: 'NL', image: null})
}
```

A field the serializer gains then appears without anyone editing this file,
and `formDefaults` checks the override keys against the schema's entries, so a
field the backend renamed throws at import instead of quietly defaulting
nothing.

It returns the schema's own input with `Required` lifting the optional
modifier, which is why the blank satisfies the form's declared type with no
assertion: `Required` drops both the `?` and the `undefined` a nullish entry's
input carries, and that is exactly the shape a form that fills every field
holds.

**`overrides` is where the form's judgement goes**, and it should only ever
say something the type cannot imply:

| The blank differs because | Override |
| --- | --- |
| a new record starts somewhere specific | `{country_code: 'NL'}`, `{member_type: 'maintenance'}` |
| the entry is a *required* integer but the picker is unchosen | `{module: null}` |
| the entry is **optional** and "no opinion" is not `0` | `{max_users: undefined}` |
| a staged upload means "no file picked", not an absent key | `{image: null}` |

The two directions of "blank" are the trap: `formDefaults` seeds every
non-nullable scalar (`''`, `0`, `false`), so an `v.optional(v.number())` comes
back as `0` when the form means *absent*, and a required integer whose input
is an unchosen picker comes back as `0` when the form means `null`. Both are
fixable only by an override, and both are worth a comment saying which claim
is being made.

**This is for a form that holds the whole component.** A form bound to a
*subset* of a large serializer — the company-info screen against
`vPatchedMemberRequest`, which carries 27 fields where the screen owns 15 —
must not derive from the whole component: `formDefaults` would hand the form
every field the serializer declares, including the twelve another screen owns.
Those keep either their own literal or pick their keys first with
`formSchema`, and the pick list is then the part worth reviewing.

**Done when**: the file no longer lists a blank value for every field, and
every override in it states a decision the schema cannot make. Where the
derived blank happens to equal the literal exactly, keep whichever reads
better; the point is not to convert files, it is to stop restating the
schema's own types.

### 9. Name the resource, not its parts

A form writes through one of two bodies depending on whether it is creating or
editing, and it used to say so twice - once in `validate`, once in `parse`:

```ts
export function validateBranch(values: BranchFormValues): BranchFieldErrors {
  return fieldErrors(vBranchRequest, shaped(values), {}, FIELD_LABELS)
}

export function parseBranch(values: BranchFormValues, context: WriteContext) {
  const body = shaped(values)
  if (!context.isCreate) return v.parse(vPatchedBranchRequest, body)
  return v.parse(vBranchRequest, body)
}
```

And the component said it four more times: the retrieve options, the create
and update mutations, the list key it invalidates. Six generated names that
must belong to one resource, and every combination typechecks.

`src/api/resources.gen.ts` binds them once. `npm run codegen` writes it from
`openapi/schema.yaml` (`scripts/generate-resources.mjs`): one export per
resource the API lists, creates or updates, carrying its reads as `{options,
queryKey}`, its writes as `{mutation, body}`, and in `reads` the query-key id
of every list and retrieve under its path.

Generated code is reached through one name, `src/services/api-client`:

```ts
import * as Api from '@/services/api-client'

Api.CompanyBranch.list.options()
Api.CompanyBranch.Record // the record retrieve answers with
Api.CompanyBranch.CreateInput // the body create takes, as it is sent
Api.Branch // any type from types.gen
```

That import is explicit rather than an auto-import, and deliberately so: a
value auto-import entry emits `const Api: typeof import('...')` and carries
no types, a `type: true` entry emits `export type * as Api` and makes the
name unusable as a value. A generated name has to be reachable as both, and a
namespace import is the one form that is. `auto-imports.config.js` records the
same reasoning next to the entries it replaces.

Each resource's own types hang off it as a `declare namespace` beside the
const, so a form reaches the record a read answers with and the body a write
takes from the same name as the read and the write:

| Alias | What it is |
| --- | --- |
| `<resource>.Record` | what `retrieve` answers with |
| `<resource>.ListResponse` | what `list` answers with |
| `<resource>.ListQuery` | the `list` query parameters (when it has any) |
| `<resource>.CreateInput` / `CreateOutput` | the `create` body, as sent / as parsed |
| `<resource>.UpdateInput` / `UpdateOutput` | the `update` body, as sent / as parsed |

`Record` is bound to the operation's own `*Response` type and the bodies to the
valibot schema, so none of them can name the wrong resource; the generator
checks both against what hey-api declared and fails the run if a name moved.

Each resource also carries the conveniences a consumer would otherwise
re-derive from `kind` and `id`, generated from the same bindings so they cannot
drift:

| Convenience | What it is |
| --- | --- |
| `listOptions(query, filters?)` | the list options plus the four base page parameters, with this resource's column filters |
| `retrieveOptions(id?)` | the retrieve options, with the path a collection needs and without it for a singleton |
| `createMutation()` / `updateMutation()` / `destroyMutation()` | that operation's mutation options, for `useMutation` |
| `updateVars(id, body)` / `updateVars(body)` | what an update sends: `{path, body}` for a collection, `{body}` for a singleton |
| `invalidate(queryClient?)` | every read under this resource's path, refreshed |
| `extras.<verb>` | a verb the server serves on *one* of this resource's records, under its path |

`extras` holds what the generator used to drop: the record-level verbs, matched
by `isAction` - `/branch/{id}/dashboard/`, `/apiuser/{id}/revoke/`,
`/order/{id}/set_order_accepted/`. A screen that needs one names the resource
and reaches for `Api.CompanyBranch.extras.dashboardRetrieve`, so a verb on a
record never becomes a second bare generated import. Ownership is by **path**
(longest resource path that prefixes it), not by operationId prefix: the name
would attach `companyPartnerRequestAccept` to `partnerRequest` by luck of
spelling, and the path is what the server actually answers. Read-only verbs
carry `{options, queryKey}` like `list`; the rest carry `{mutation, body?}`.
25 resources have them today.

## The codemod

`npm run use-api-namespace` rewrites the `@/api/**` imports to `Api`. It takes
a directory (`npm run use-api-namespace -- src/features`) and a `--dry` flag,
renames through the ts-morph *symbol* so a shadowing local is untouched, and is
idempotent - a second run rewrites nothing. Anything it cannot place is printed
by name and left imported, which is how the remaining 34 were found.

Two things it is careful about, both of which were bugs first:

- The **script** pass renames identifiers that resolve to the import, skipping
  the specifier's own name, and then rebuilds each declaration from the
  specifiers that still have no other home. Rebuilding rather than deleting is
  what makes a *partly* placed declaration correct.
- The **template** pass is not textual. It walks `descriptor.template.ast` and
  rewrites identifiers inside directive bindings and interpolations, so a
  string literal is never a candidate - a whole-word substitution turned
  `$trans('Invoice has been deleted')` into `'Api.Invoice has been deleted'`.
  The expression offsets are relative to the whole file, not the template
  block; getting that wrong lands them inside string literals.

`listOptions` is what a server-paged table takes, and a screen names nothing:

```ts
useServerTable<Row>({
  listOptions: (query) => Api.CustomerCustomer.listOptions(query),
})
```

`filters` defaults to **every query parameter the endpoint declares**, less the
four the base parameters already send (`page`, `page_size`, `q`, `ordering`)
and the deprecated `sort_dir`/`sort_field`. So a screen whose columns are the
endpoint's own filters cannot drift from them: the generator writes the set
once, annotated `readonly (keyof <Resource>.ListQuery)[]`, which is what fails
the build if the schema drops a filter. `CustomerCustomer` derives
`['city', 'contact', 'name', 'num_orders', 'remarks']` - the five its columns
offer.

Naming `filters` is for the exceptions:

- a screen that wants a **subset** of the endpoint's filters, or
- a screen filtering on something the endpoint does not declare - which the
  annotation rejects, since that is a real mismatch and not a naming choice.

A derived name a screen has no column for is simply absent from the table's
query and never reaches the wire, which is what makes deriving safe even for a
list with 30-odd parameters.

drf-spectacular emits no `deprecated: true` for `sort_dir`/`sort_field`, so the
exclusion cannot be read off the schema; it is `EXCLUDED_PARAMS` in the
generator, with the reason, like `UNREACHABLE_SHADOWS`. A list whose endpoint
takes a required query parameter, a required path, or no query at all gets no
`listOptions` - the generator says so in its run summary, and those keep the
bare `list.options`.

`limit` and `offset` are the exception that is derived but *not* a filter: they
page by a different mechanism than `page`/`page_size`, so a screen that set one
would send `?offset=` beside `?page=`. Only the order lists declare them (14 of
them, all under `api/order/order/`), no screen has a column for either, and
neither reaches the wire - so they are derived like any other name and the run
summary names every resource whose derived set contains one, so that a screen
adopting one becomes a decision rather than an accident.

`invalidate` replaces the delete modal's two-name spelling:

```vue
:delete-modal="{
  destroyMutation: Api.CompanyBranch.destroyMutation,
  invalidate: Api.CompanyBranch.invalidate,
  ...
}"
```

Its `queryClient` parameter defaults to the application singleton rather than to
`useQueryClient()`, which throws outside an injection context - and a delete
modal calls it from a click handler. The singleton is the instance the plugin
installs, so the default is what the composable would have returned whenever
the composable would have worked at all. A caller already holding a client (a
form, inside `setup`) passes it.

Note that a resource's `invalidate` covers *every* read under its path. That is
the right scope for a write to that resource, and too broad for a write whose
stale reads are a *subset* of another: renaming a module does not stale the
member's `me` read, so the module and statuscode `invalidation.ts` modules name
their query keys rather than composing two `invalidate`s. `invalidateReads(reads)`
in `src/services/api-client/invalidation.ts` is there for the case that does
want the whole path, called with a resource's own `reads`.

The form names the resource:

```ts
import * as Api from '@/services/api-client'
import { writeContract } from '@/features/forms/write-contract'

export const branchWrite = writeContract(Api.CompanyBranch, {
  validateWith: Api.CompanyBranch.create.body,
  shape: shaped,
  labels: FIELD_LABELS,
})
export type BranchValues = Api.CompanyBranch.CreateInput
```

and the component hands `useResourceForm` the same object, dropping its
`retrieve`, `create`, `update` and `invalidate` lines:

```ts
const form = useResourceForm<...>({
  pk: () => props.pk,
  resource: CompanyBranch,
  validate: branchWrite.validate,
  parse: branchWrite.parse,
  ...
})
```

It is one or the other: a form wired by resource may not also name a
`retrieve` or a mutation, and one wired by hand must name all of them. The
types say so, so a mix does not compile.

- The body schemas are hey-api's own `v<Operation>Body` aliases, reached as
  `CompanyBranch.create.body`. Step 2's table still applies to what they
  resolve to; you just no longer pick the const by hand. `formDefaults` and
  `v.InferInput` take `resource.create.body` the same way they took the const.
- `validateWith` is for the form whose validation is not the body it sends.
  Two reasons qualify, and both should be written out in a comment: an edit
  that saves the **whole record** validates against the create body (step 2's
  exemption), and a form carrying a ledger rule validates against its
  strengthened copy. Everything else validates what it submits.
- `parseCreate` and `parseUpdate` are for the caller that hands a body straight
  to one generated mutation - a union satisfies neither mutation's exact body
  type. `parse(values, context)` is the union-returning one `useResourceForm`
  wants.
- A resource's `kind` says how its record is addressed. `useResourceForm`
  reads it: a `singleton` (`branch-my`, `member/me`) has no path, so its update
  sends only the body and the screen no longer writes `updateVars` for that.
- `invalidate` defaults to `invalidateReads(resource)`: every read under the
  resource's path - its list, its detail, the filtered views and counts beside
  them (`user-sick-leave/admin/all_sick/`, `.../all_unconfirmed_count/`) - is a
  read of the same rows, and the generator collected them. A list screen's
  delete modal takes the same helper: `invalidate: invalidateReads(CompanyBranch)`.
  What remains hand-written is the read the schema cannot connect to the write:
  a module write changing what the *member* list returns, the dispatch board
  under another resource's path. Those live in an `invalidation.ts` composed
  with `invalidateReads`, and the module's comment says why the schema could
  not know.

**Done when**: the schemas file imports its resource from `resources.gen` and
nothing from `valibot.gen` that the resource already carries, the component
passes that resource instead of naming its options and mutations, and no
`invalidation.ts` beside it restates the resource's own reads.

### The form a field is written into

`ValidatedForm` hands down the four facts every field of one form repeats — the
id's prefix, the values object, the errors, the copy — so a field names itself
and nothing else:

```vue
<ValidatedForm
  name="member"
  v-model="member"
  :errors="errors"
  :labels="FIELD_LABELS"
  :submitted="submitClicked"
>
  <ValidatedFormField name="address" />
  <ValidatedFormField name="contacts" textarea />
</ValidatedForm>
```

A field derives `id` as `<form name>_<field>`, `value` as `values[field]`,
`error` as `errors[field]`, its label as `FIELD_LABELS[field]()` and its
placeholder as the required line for that label (or `messages[field]()` when the
form passes `:messages`). Anything passed explicitly wins over the
derived value, and that is how the exceptions are said: `id` where the id is not
the field's name, `label` where the caller overrides it, and `type`,
`textarea`, `rows`, `autofocus` and `label-cols` for the field that is not a
plain one. Both components live in `src/features/forms/`; `MemberForm.vue` is
the reference.

## What the file ends up containing

For a straightforward form, all of it:

```ts
export function emptyModule(): ModuleRequest {
  return formDefaults(vMemberModuleCreateBody)
}
// + FIELD_LABELS, validateModule, parseModule
```

No schema is declared, because there is nothing to declare: the form parses
`vMemberModuleCreateBody` and the file holds the blank-form default, the labels
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

- `src/features/member/module/schemas.ts` — the whole file, ~30 lines, no
  strengthening at all, and a blank derived from the request component.
- `src/features/company/branch/schemas.ts` — a blank derived with two stated
  overrides (`country_code`, the staged `image`) where the hand-written
  literal listed all ten fields.
- `src/features/user/sales/schemas.ts` with `../user-form.ts` — seven forms on
  one shared base, parsing the generated component directly, sharing the
  rules the schema cannot carry (password confirmation, the probe verdict).
- `src/features/customer/customer/schemas.ts` — piping and `v.required` on a
  create/patch pair, with the read-only companions named.
