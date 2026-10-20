# The unit suite

## What these specs are

Three kinds of test live here.

The **model and service specs** (`models/`, `services/`, `utils/`, `mixins/`)
test units directly.

The **call-shape specs** (`views/`, `components/`) pin the requests a legacy
screen puts on the wire — path, query, and body — through the network seam
below, like the Slice specs.

The **schema-conformance specs** (`api/`, alongside the call-shape ones) mount
nothing. They parse a literal payload against a generated valibot schema and
assert whether it is accepted, pinning what the contract says a form may send.
Keep them to cases where being wrong means a user is told something false about
their own form — a schema too strict rejects a body the API would have stored,
one too loose passes a body the API answers 500 to.

The **seam specs** (`features/*/*.spec.js`, `api/api-seam.spec.js`) run
against the network seam (`support/api-seam/`), below both HTTP clients. Read
its header for what it refuses. They drive the Slices in `src/features/`.

## Why the network seam, and not a client fake

The suite used to have a second seam: a **client fake** that replaced the HTTP
clients and recorded whatever request the code made, asserting it as correct. A parameter the code stopped sending simply is not
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

Await `settle()` from the seam, never a `for (i…) await Promise.resolve()`
loop. A real request comes back on a macrotask, so
a microtask flush returns before it has even been recorded — and an assertion
that a request was *not* made then passes without observing anything.

Every spec that talks to the backend is on the network seam now; the client
fake is gone. Moving the last ones found three query parameters the dashboards
sent that the schema did not declare, and one on the material search; the
backend declared the ones it honours and the frontend stopped sending the
rest. Keep new specs there.

## How requests are pinned

A seam spec asserts the whole set of requests a screen put on the wire, in
order, against a literal written in the spec:

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/member/contract/', query: { page: '1', page_size: '1000' } },
      { method: 'post', path: '/api/member/member/', query: {}, body: { … } },
    ])

Those literals are hand-maintained. They were once transcribed from recordings
taken from a browser against a development tenant, and the recordings were
retired: refreshing one took a staff login, a manual capture and a hand-written
normaliser, and the normalisers had grown to the point where most of the
recorded bytes were compared against nothing.

What a literal buys is a request the screen stopped sending, or started
sending, because the expected list is written down independently of the code.
What it cannot buy is a request that the code and the literal get wrong
together. Only a live recording could, and that is the trade this makes.

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

## Two projects: shared and isolated

Most spec files run in the `shared` project, which turns vitest's per-file
isolation off: a worker evaluates the app's module graph once and every file it
runs reuses it, along with one happy-dom window. Re-evaluating that graph per
file used to cost more than all the test bodies together. Specs that call
`vi.mock` (or `vi.doMock`, `vi.unmock`, `vi.resetModules`) go to the
`isolated` project instead, because a module mock cannot reach a graph an
earlier file already loaded. `vitest.config.js` sorts files by scanning their
source, so there is no list to keep up to date.

`vitest --project shared` or `--project isolated` runs one of them.

A shared worker keeps whatever a spec leaves behind, so a shared spec must
put back what it changes:

- Stub globals with `vi.stubGlobal`, not by assignment or
  `Object.defineProperty`; stubs are undone before each test and after each
  file. For `document.location`, `vi.spyOn(document, 'location', 'get')`.
  `setupTests.js` fails the next file if `location` is left replaced, and names
  the file that did it.
- Restore anything assigned onto a shared object: an axios instance's
  `defaults.adapter`, a model singleton's state (`useFreshModel` in
  `support/list-harness.js`), a store outside a component.
- Don't mock bootstrap-vue-next for toasts or vue-loading-overlay:
  `setupTests.js` does both once for the suite. Read the toast spy through
  `toastCreate` / `toasts()` from `support/form-harness.js`. The same file
  enables auto-unmount for every spec.
- Don't `vi.spyOn` a `localStorage` method: happy-dom's `Storage` cannot
  restore it, and the next file inherits a storage that cannot write. Replace
  it with `Object.defineProperty` and put the original back (see
  `features/auth/auth-store.spec.js`). `setupTests.js` fails the next file if
  storage is left broken.
- Reach for a spy before `vi.mock`, which sends the spec to the isolated
  project: `stubSocket()` (`support/sockets.js`) for the websockets. For HTTP,
  the network seam. The HTTP clients' `defaults.adapter` is put back before
  every test.

## Input delays are zero

The application's debounces (search boxes, autocompletes, the username and
company-code probes, a list's search and column filters) read their delay from
`src/services/input-delays.ts`, and `setupTests.js` sets every one of them to
zero before each test. Input acts the moment it is typed, so a spec needs a
`settle()` after typing, never a sleep. A spec about a delay itself (nothing
asked before the half-second, one ask after it) calls `useRealInputDelays()`
from `support/input-delays.js` first; the next test starts from zero again.

To check that a change has not made the shared project order-dependent, shuffle
the file order:

    npx vitest run --project shared --sequence.shuffle.files --no-sequence.shuffle.tests --sequence.seed=2

`npm run test:changed` runs only the spec files whose module graph reaches a
file changed since the last commit (`vitest run --changed`; pass a ref, e.g.
`-- origin/develop`, to compare against a branch).
