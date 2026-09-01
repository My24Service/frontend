# 3. Generated valibot request schemas as the form validator

Date: 2026-08-25

## Status

Accepted.

## Context

Every form in the application has carried a parallel, hand-written description
of what its request may look like: Vuelidate rules beside the fields. Those
rules answer to the component, not to the API, so the two drift independently —
a rule grows `required` where the backend allows blank, or stays silent about a
length the serializer enforces. The user finds out on submit, from a 400.

The repository also already owns a machine-checked description of every
request: the valibot schemas generated from `openapi/schema.yaml`
(`src/api/valibot.gen.ts`). Since #318, the test seam holds every request body
the suite puts on the wire against exactly those schemas. The application
itself did not use them; only its tests did.

Vuelidate carried one more cost specific to how this codebase used it. Under
the Options API, a form model reassigned after construction (the usual
`init()` pattern: fetch, then replace the object) silently stopped being
tracked — the rules kept validating the first object. ModulePartForm carried a
comment explaining that its rules had to be passed to `useVuelidate` explicitly
to survive exactly this reassignment. A validation library whose correct use
needs a paragraph of warning is a liability the rewrite does not have to keep.

## Decision

Forms in a rewritten Slice validate by **parsing their values against the
generated valibot request schema** for the endpoint they submit to. There is no
Vuelidate in the Slice.

The shape of it, established with Module Part (#321):

- One function per form returns field-level messages derived from the parse
  issues — which field broke and why is the schema's verdict; the copy is the
  screen's.
- On submit, the same schema's *parse output* is the request body. What goes on
  the wire is typed by the schema and stripped of keys it does not declare,
  which is how forms stop posting leftover model fields (`module_name`, `id`)
  the API never asked for.
- If a rule turns up that valibot handles badly — cross-field rules are the
  known case — valibot keeps shape, type and required-ness, and Vuelidate may
  be retained **for that rule alone**, with a comment saying why. No such rule
  was found in this Slice; the escape hatch exists because the next Slice may
  find one, and the code must force it rather than assume it.

## Alternatives considered

**Keep Vuelidate alongside the generated schemas.** No migration risk, but two
descriptions of the same contract remain, and the tests enforce one while the
form enforces the other — the exact arrangement that let forms grow stale
without anything noticing.

**Hand-write zod/valibot schemas per form.** Better than Vuelidate, still a
second description. The generated ones exist; writing another by hand re-opens
the drift this ADR closes.

**Server-side validation only.** Zero duplication, but every mistake costs a
round trip and an error envelope the form then has to interpret per endpoint —
and "validation reflects what the API accepts" arrives as a promise instead of
a shared artifact.

## Consequences

- Form truth and wire truth are one artifact. When the API changes, `npm run
  codegen` moves the form with it.
- Field-level messages need maintaining as copy mapped from issue kinds;
  generic fallbacks stay possible when no specific copy exists.
- A gap surfaced immediately: DRF's `required=True` (blank rejected) reaches
  the generator only as `string` + `maxLength`, so a blank name parsed clean.
  The Module Part schema adds `minLength(1)` locally, commented, until the
  request-schema correctness ticket makes required-ness real in the generator.
  That ticket, not a local workaround, owns the general fix.
- The Options-API tracking footgun is gone structurally: there is no rules
  object to lose track of a reassigned model, only a parse at submit time.
