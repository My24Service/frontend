# Recording a golden

A golden is the set of requests a screen puts on the wire, captured from the
running application against a development tenant. `tests/unit/golden/` holds
them; `tests/unit/helpers/golden.js` reads them; the specs in
`tests/unit/views/member/` assert against them.

They are recorded rather than written because a golden written by reading the
component cannot disagree with the component. It certifies whatever the code
does, including the bug — which is exactly how a customer-facing list lost its
pagination, search and sorting while its spec stayed green (#313). A recorded
golden cannot be wrong about what the old code did, because it is what the old
code did.

## Recording

1. Start the backend on a development tenant.

2. Start the frontend with the recorder on. **Port 3000 is not optional** — a
   fallback port breaks the API proxy and the app comes up blank.

   ```bash
   VITE_RECORD_GOLDENS=1 npm run dev -- --port 3000 --strictPort
   ```

3. Open the tenant (`http://riedel.localhost:3000`, or whichever theme you
   want) and log in as staff. The recorder announces itself in the console.

4. Navigate to the screen, then in the console:

   ```js
   golden.start()
   ```

5. Drive the interaction — load the list, click page 2, search, submit the
   form. Drive it through the UI. Calling a method from the console records a
   request the application would not necessarily have made.

6. Check what was captured, then save it:

   ```js
   golden.show()
   await golden.save('member-list', 'search surviving a page change')
   ```

   That writes `tests/unit/golden/member-list.json` with that scenario key,
   leaving the file's other scenarios alone.

The screen name is the spec's own (`member-list`, `member-form`,
`contract-list`, `contract-form`, `module-list`, `module-form`,
`module-part-list`, `module-part-form`). The scenario name has to match the one
the spec passes to `goldenTest`, and a spec whose scenario is not in the file
**skips**, naming itself in the run output — so `npm test` tells you what is
still outstanding.

## What it records, and where from

`browser.js` patches `XMLHttpRequest` and `fetch` — below both HTTP clients,
the same boundary `tests/unit/support/api-seam/` intercepts at. Recording above
a client would record what the client was asked to do rather than what went on
the wire, which is the failure this exists to catch.

Both sides write a request down with
`tests/unit/support/api-seam/normalize.js`, and neither keeps its own copy. If
they spelled a query string or a form body differently, every recorded golden
would fail for a reason that has nothing to do with the application — and the
obvious repair would be to edit the golden until it matched the seam, which is
deriving the golden from the code again by a slower route.

The CSRF handshake and everything outside `/api/` are left out; the seam leaves
them out too.

## Responses are not recorded

Only requests. Responses in the specs are built from the generated valibot
components by `tests/unit/helpers/schema-fixture.js`, and the seam parses every
stubbed response against that endpoint's own response schema — so a fixture the
backend could not have sent fails the spec that wrote it.

That is a weaker claim than the requests carry, and it is worth being plain
about: a fixture is a shape the backend *could* send, not one it was observed
sending.

## Where a path cannot be recorded

Error branches mostly cannot be driven from the UI against a healthy tenant. A
spec for one of those asserts what the user is told, not a golden, and where it
needs to claim something about the backend's own behaviour it cites the view or
serializer that proves it. A bare derived assertion is not acceptable — see
#319.

## Not in production

The plugin is `apply: 'serve'` and is only added when `VITE_RECORD_GOLDENS` is
set, so a normal dev session is untouched and a build cannot contain it. The
route it adds writes a file from an unauthenticated POST, so it answers loopback
requests only — the dev server binds `0.0.0.0` for tenant hostnames, and without
that check the route would be on every interface of the machine.

Record through `localhost` or a `*.localhost` host for that reason; a recording
driven from another device on the network is refused with a 403.
