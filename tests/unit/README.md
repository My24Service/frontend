# The unit suite

## What these specs are

Three kinds of test live here.

The **model and service specs** (`models/`, `services/`, `utils/`, `mixins/`)
test units directly.

The **call-shape specs** (`views/`, `components/`) pin the requests a screen
puts on the wire — path, query, and body. They mount a view against a fake
HTTP client (`support/api-client-mock.js`, read through
`support/request-recorder.js`).

The **schema-conformance specs** (`api/`, alongside the call-shape ones) mount
nothing. They parse a literal payload against a generated valibot schema and
assert whether it is accepted, pinning what the contract says a form may send.
Keep them to cases where being wrong means a user is told something false about
their own form — a schema too strict rejects a body the API would have stored,
one too loose passes a body the API answers 500 to.

The **seam specs** (`features/*/*.spec.js`, `api/api-seam.spec.js`) run
against the network seam (`support/api-seam/`), below both HTTP clients. Read
its header for what it refuses. Their goldens live in `golden/`. They drive
the Slices in `src/features/`.

## The two seams, and why both exist

A call-shape spec on a **client fake** records whatever request the code made
and asserts it as correct. A parameter the code stopped sending simply is not
in the recording, so the spec stays green while the screen loses a query
parameter.

A spec on the **network seam** sees the request as it would go on the wire,
and its handlers are generated from `openapi/schema.yaml`, so an undeclared
path, an undeclared query parameter or a body the request schema rejects fails
the test whether or not anyone wrote an assertion for it.

It checks both directions. A request is judged against the operation's
parameters and generated request schema; a **stubbed response** is judged
against that endpoint's own response schema, so a fixture the backend could not
have sent fails the spec that wrote it. Build fixtures with
`helpers/schema-fixture.js` and that is a one-liner; an explicit `HttpResponse`
opts out, which is what a failure-path spec wants.

Await `settle()` from the seam, never the `for (i…) await Promise.resolve()`
idiom the client-fake specs use. A real request comes back on a macrotask, so
a microtask flush returns before it has even been recorded — and an assertion
that a request was *not* made then passes without observing anything.

The network seam is where new specs go. `support/api-client-mock.js` and
`support/request-recorder.js` die when the last client-fake spec converts.

## Goldens, and why they are recorded

A **golden** is the whole set of requests a screen put on the wire, and it is
*recorded from the running application against a development tenant* — not
written here and not read out of the component. The source is a HAR captured
from a browser session against a real tenant; `golden/README.md` is the
procedure, `npm run golden` converts a capture, and `helpers/golden.js` reads
what came back.

A golden derived by reading the code cannot disagree with the code, so it
certifies whatever the code does — including a dropped query parameter.

One file per screen, scenarios keyed inside it:

    golden/module-form.json
    { "create": [ … ], "edit": [ … ] }

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
the backend's own behaviour cites the view or serializer that proves it. See
the header of `features/member/contract-form.spec.js` for one such citation.

## Conventions

`support/form-harness.js` carries the mounting conventions and the traps they
exist to encode — in particular that `b-overlay` must never be stubbed, since
it is what makes loading state visible to the DOM. Read its header before
writing a new view spec.

Three more supports sit on top of it, each written up in its own header:

- `support/list-harness.js` — what the list specs share.
- `support/modal.js` — driving a `b-modal` through its DOM. Search and delete
  confirmation both live in one, and a modal is teleported to `document.body`
  where `wrapper.find` cannot see it.
- `support/member-routes.js` — the routes the Member-Slice screens link to. A
  deep mount renders real `<router-link>`s, and one pointing at an unknown
  route throws rather than rendering.
