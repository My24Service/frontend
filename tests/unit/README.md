# The unit suite on `base/generated-api-layer`

## What these specs are

Three kinds of test live here.

The **model and service specs** (`models/`, `services/`, `utils/`, `mixins/`)
test units directly.

The **call-shape specs** (`views/`, `components/`, `api/`) are
characterisation: they mount a view against a fake HTTP client and pin the
requests it puts on the wire — path, query, and body. They exist so the
Member-Slice rewrite can prove it did not change what the frontend asks the
backend for.

The **schema-conformance specs** (`api/`, alongside the call-shape ones) mount
nothing. They parse a literal payload against a generated valibot schema and
assert whether it is accepted, pinning what the contract says a form may send.
They are for the corrections where the schema and the API had disagreed: the
disagreement lives in the backend annotation, the fix arrives here as a
regeneration rather than as an edit to any file a reviewer reads, and so a
regression would otherwise be invisible. Keep them to cases where being wrong
means a user is told something false about their own form — a schema too strict
rejects a body the API would have stored, one too loose passes a body the API
answers 500 to.

## Reading the migration wording

The call-shape specs were written on the abandoned horizontal branch, where the
hand-written `BaseModel` calls had already moved to the generated SDK, and their
comments describe that move: "used to GET `/order/workorder-data/{uuid}/`, now
calls `orderWorkorderDataRetrieve`". On **this** branch nothing has moved yet —
the hand-written call is what runs.

The assertions hold either way, and that is the point. `support/request-recorder.js`
normalizes the two seams' only differences (the `/api` prefix, which the legacy
client keeps in its `baseURL`; and query serialization), so one recorded shape
describes both. A comment naming a generated op is naming the shape the
migration has to reproduce, not the code path this branch takes.

One thing this asymmetry does bite: `resetFakeHttp` routes are keyed on the URL
the client actually calls, so a fixture for a legacy call site is keyed
**without** the `/api` prefix, even though `requestShapes` reports the
normalized path back. Getting this wrong yields a spec that passes on its
recorded shape while the component silently receives `[]`.

## Conventions

`support/form-harness.js` carries the mounting conventions and the traps they
exist to encode — in particular that `b-overlay` must never be stubbed, since it
is what makes loading state visible to the DOM. Read its header before writing a
new view spec.

## What was dropped

The specs replayed from the abandoned branch were triaged in #315: those
asserting behaviour that only exists after the migration were dropped, and the
drop list is recorded on that issue.
