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
4. Drive the scenarios, through the UI — load the list, click page 2, search,
   submit the form. A request made from the console is not a request the
   application made.
5. Right-click the request list → **Save all as HAR with content**.

One capture may cover several scenarios; you say which requests were which when
you convert it. The tool does not guess where one scenario ends and the next
begins — only the person who did the clicking knows that, and guessing the
boundary would be one more way of deriving the golden.

## Converting

List what a capture holds:

    npm run golden -- ~/Downloads/riedel.localhost.har

    2 API call(s) in the capture:

      [0] GET /api/member/member/?is_requested=False&is_deleted=False&page=1
      [1] GET /api/member/member/?is_requested=False&is_deleted=False&page=2

Then write each scenario, naming the entries that belong to it:

    npm run golden -- <file.har> --screen member-list \
        --scenario "initial load as superuser" --entries 0

`--entries` takes indices or ranges: `0`, `0,2`, `1-4`. The result is an entry
in `<screen>.json`, keyed by scenario:

    golden/member-list.json
    { "initial load as superuser": [ … ], "page 2": [ … ] }

The scenario name has to be one a spec actually asks for. A typo is refused
rather than written, because a golden nothing reads leaves the scenario skipping
while looking recorded.

`npm run golden -- --todo` lists what is still outstanding.

Every entry goes through `../support/api-seam/normalize.js`, which is also what
the seam uses when it watches a spec's requests — neither side keeps its own
copy. If the two spelled a query string or a form body differently, every
recorded golden would fail for a reason that has nothing to do with the
application, and the obvious repair would be to edit the golden until it matched
the seam. Which is deriving it from the code again.

Everything that is not an API call is dropped, and each of those would otherwise
put a request in a golden the seam will never see:

- anything outside `/api/` — assets, the document, HMR, source maps. The app and
  the API are different origins in development (`:3000` and `:8000`), so the
  path is the test, not the host.
- **CORS preflights.** Because the API is a different origin, every XHR is
  preceded by an `OPTIONS` the browser sent on its own. The application did not
  make that request and neither does the seam. A four-entry capture is usually
  two requests.
- the CSRF handshake, which precedes every write and belongs to no screen's call
  shape.

## A note on handling the files

The converter reads only method, URL and request body. It never reads headers,
and HAR files are not committed — a capture of an authenticated session can
carry session cookies or an `Authorization` header, and a golden needs none of
it.

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
