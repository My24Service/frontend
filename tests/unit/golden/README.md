# Recording a golden

A golden is the set of requests a screen puts on the wire. The files beside this
one hold them, `../helpers/golden.js` reads them, and the specs in
`../views/member/` assert against them.

They are **recorded from the running application against a development tenant**,
not written by hand and not read out of the component. A golden derived by
reading the code cannot disagree with the code: it certifies whatever the code
does, including the bug. That is how a customer-facing list lost its pagination,
search and sorting while its spec stayed green (#313). A recorded golden cannot
be wrong about what the old code did, because it is what the old code did.

## Recording

The source is a **HAR file**, captured from a real browser session against a real
tenant with a real staff login. That is deliberate: the previous attempt at this
built a recording mechanism into the dev server, which moved the problem rather
than solving it — recording still needed a working application and a login, and
so nothing was ever recorded. A HAR needs neither the repository's cooperation
nor anybody's credentials in a script.

1. Open the tenant in Chrome and log in as staff.
2. Open DevTools → Network. Tick **Preserve log**.
3. Navigate to the screen, then clear the network log so the capture starts
   clean.
4. Drive the one scenario, through the UI — load the list, click page 2, search,
   submit the form. A request made from the console is not a request the
   application made.
5. Right-click the request list → **Save all as HAR with content**.
6. Name it `<screen>--<scenario>.har`, matching the names the spec passes to
   `goldenTest` — `module-list--initial load.har`.

One HAR per scenario. A single capture covering several scenarios would have to
be split by reading the request sequence, and guessing where one scenario ends is
deriving the golden again by a slower route.

## Converting

`npm run golden <file.har>` turns a capture into an entry in
`<screen>.json`, keyed by scenario:

    golden/module-list.json
    { "initial load": [ … ], "search": [ … ] }

Every entry goes through `../support/api-seam/normalize.js`, which is also what
the seam uses when it watches a spec's requests — neither side keeps its own
copy. If the two spelled a query string or a form body differently, every
recorded golden would fail for a reason that has nothing to do with the
application, and the obvious repair would be to edit the golden until it matched
the seam. Which is deriving it from the code again.

Everything that is not an API call is dropped: assets, HMR, source maps, the
CSRF handshake that precedes every write. The seam drops the same set.

## Responses are not recorded

Only requests. Responses in the specs are built from the generated valibot
components by `../helpers/schema-fixture.js`, and the seam parses every stubbed
response against that endpoint's own response schema — so a fixture the backend
could not have sent fails the spec that wrote it.

That is a weaker claim than the requests carry, and it is worth being plain
about: a fixture is a shape the backend *could* send, not one it was observed
sending.

## Where a path cannot be captured

Some paths cannot be driven from a browser against a healthy tenant — an error
branch, or a screen that is broken. Two rules:

- A spec for one of those asserts **what the user is told**, not a golden.
- Where it must claim something about the backend's own behaviour, it **cites**
  the view or serializer that proves it. A bare derived assertion is not
  acceptable. See the header of `../views/member/contract-form.spec.js` for one
  such citation.

`member-form / create attempt` is the awkward case worth knowing about: a Member
cannot be created through that screen at all, because `MemberForm` binds `@input`
on a `b-form-file` that emits only `change`. So the recorded scenario is the
attempt — a filled form and a Save that posts nothing — and that is the whole
truth about what the screen does today.

## What is still outstanding

A scenario the spec asks for and this directory does not have **skips**, naming
itself in the run output, and never falls back to an assertion written in the
spec. A hand-written stand-in would be a derived golden wearing a recorded
golden's name, which is worse than an obvious gap: the gap gets recorded, the
stand-in gets believed.

So `npm test` is the list of what is left.
