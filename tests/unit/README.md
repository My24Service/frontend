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

The **seam specs** (`features/member/*.spec.js`, `api/api-seam.spec.js`) are
call-shape specs recorded one layer lower: below both HTTP clients rather than
in place of one. `support/api-seam/` holds the seam; read its header for why it
exists and what it refuses. Their goldens live in `golden/`. They drive the
converted Slice in `src/features/member/` — which, since #325, is the Member
Slice's whole surface, lists and forms alike; the screens still awaiting their
ticket have no specs here yet, only their legacy client fakes elsewhere.

## The two seams, and why both exist

A call-shape spec on a **client fake** records whatever request the code made
and asserts it as correct. A parameter the code stopped sending simply is not in
the recording, so the spec stays green while the screen loses its pagination —
which is what happened, and is why #313 exists.

A spec on the **network seam** sees the request as it would go on the wire, and
its handlers are generated from `openapi/schema.yaml`, so an undeclared path, an
undeclared query parameter or a body the request schema rejects fails the test
whether or not anyone wrote an assertion for it.

It checks both directions. A request is judged against the operation's
parameters and generated request schema; a **stubbed response** is judged
against that endpoint's own response schema, so a fixture the backend could not
have sent fails the spec that wrote it. Build fixtures with
`helpers/schema-fixture.js` and that is a one-liner; an explicit `HttpResponse`
opts out, which is what a failure-path spec wants.

Await `settle()` from the seam, never the `for (i…) await Promise.resolve()`
idiom the client-fake specs use. A real request comes back on a macrotask, so a
microtask flush returns before it has even been recorded — and an assertion
that a request was *not* made then passes without observing anything.

The network seam is where new specs go. Existing specs keep their client fakes
and come across as their own Slice is converted — putting the whole suite onto a
strict seam at once would surface every latent request-shape discrepancy in the
repository simultaneously, which is a useful list delivered at the worst possible
moment. `support/api-client-mock.js` and `support/request-recorder.js` die when
the last one converts, which is a useful end-state signal to keep.

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

## Goldens, and why they are recorded

A **golden** is the whole set of requests a screen put on the wire, and it is
*recorded from the running application against a development tenant* — not
written here and not read out of the component. The source is a HAR captured
from a browser session against a real tenant; `golden/README.md` is the
procedure, `npm run golden` converts a capture, and `helpers/golden.js` reads
what came back.

The distinction is the point of #319 and #320. A golden derived by reading the
code cannot disagree with the code, so it certifies whatever the code does —
including a dropped query parameter. That is how the acceptance for a broken
list came to be written down as correct.

One file per screen, scenarios keyed inside it:

    golden/module-list.json
    { "initial load": [ … ], "search": [ … ] }

`goldenTest(goldens, scenario, screen, body)` asserts one of them. A scenario
that has **not** been recorded yet skips, naming itself in the run output, and
never falls back to an assertion written in the spec — a hand-written stand-in
would be a derived golden wearing a recorded golden's name, which is worse than
an obvious gap. So `npm test` tells you what is still outstanding.

Responses are a weaker claim than requests, and it is worth being plain about
it: they are built from the generated valibot components by
`helpers/schema-fixture.js` and parsed by the seam against the endpoint's own
response schema, so they are shapes the backend *could* send — not shapes it was
observed sending.

Where a path cannot be recorded at all (an error branch, a screen that is
broken), the spec asserts what the user is told, and any claim it makes about
the backend's own behaviour cites the view or serializer that proves it. See the
header of `views/member/contract-form.spec.js` for one such citation.

## Conventions

`support/form-harness.js` carries the mounting conventions and the traps they
exist to encode — in particular that `b-overlay` must never be stubbed, since it
is what makes loading state visible to the DOM. Read its header before writing a
new view spec.

Three more supports sit on top of it, each written up in its own header:

- `support/list-harness.js` — what the four list screens share, including the
  two traps that make a list spec pass while measuring nothing: the model is a
  module-level singleton, and a page change is a remount rather than a
  re-render.
- `support/modal.js` — driving a `b-modal` through its DOM. Search and delete
  confirmation both live in one, and a modal is teleported to `document.body`
  where `wrapper.find` cannot see it.
- `support/member-routes.js` — the routes the Member-Slice screens link to. A
  deep mount renders real `<router-link>`s, and one pointing at an unknown route
  throws rather than rendering.

## What was dropped

The specs replayed from the abandoned branch were triaged in #315: those
asserting behaviour that only exists after the migration were dropped, and the
drop list is recorded on that issue.
