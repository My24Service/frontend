# Test suite performance: what was measured, what changed

2026-09-27. Follow-up to `test-suite-reduction-research.md`, which proposed
merging spec files and collapsing near-duplicate specs. This note measures
those ideas and the other levers people ask about. Every number here was
measured on this branch on a 4-core Linux container, full suite, 222 spec
files and 2,716 tests, unless it says otherwise.

## Result

| | wall | `import` CPU-s | `tests` CPU-s |
|---|---|---|---|
| before (warm module cache) | 437 s | 792 | 340 |
| shared/isolated projects | 142 s | ~105 | ~300 |
| + `maxWorkers: '100%'` | 114–120 s | ~120 | ~310 |
| + input delays zero in specs | 92 s | ~100 | ~247 |
| + 22 of 23 isolated specs moved to shared | 68 s | ~46 | ~218 |
| 2 cores, before: default workers (= 1) | 411 s | | |
| 2 cores, after all of the above | 113 s | | |

All 2,716 tests pass in every configuration. The shared project also passes
with six different shuffled file orders (`--sequence.shuffle.files`).

## Where the time went

Vitest isolates each spec file by default, and isolation means re-evaluating
the module graph. This graph is large: the generated client, bootstrap-vue-next,
the stores and the feature barrels come to ~4 s per file. Across 222 files,
`import` was 792 CPU-seconds, more than twice the 340 spent running tests.

`--no-isolate` on the whole suite brought `import` down to 31 CPU-seconds and
the run to 99 s. That number is also the ceiling for merging spec files:
merging saves re-imports, and with isolation off there are none left to save.

## What changed

**Two vitest projects** (`vitest.config.js`):

- `shared`: 199 files, `isolate: false`. Each worker loads the graph once.
- `isolated`: the 23 files that call `vi.mock` & co. A module mock only reaches
  modules imported after it is registered, so in a shared graph it would miss.
  It would also leak into the next file on the worker. Files are sorted by
  scanning their source, so nobody maintains a list.

The shared project only worked once these leaks between files were fixed:

| leak | fix |
|---|---|
| 137 specs each mocked `bootstrap-vue-next` for `useToast`. A per-file mock of a module every SFC imports cannot be shared | mocked once in `setupTests.js`; the spy moved to `support/toast.js` |
| `enableAutoUnmount` throws when called twice in one worker | called once, from `setupTests.js` |
| `setupTests.js` created a new `localStorage` per file, but `token.ts` binds it at import | one per worker, cleared before each test |
| fixture seeds were a module-level counter, so snapshots depended on which files ran first | counted per spec file |
| `unstubGlobals` undoes stubs *before* each test, so a file's last stub (a fake `location`) was still in place while the next file imported the router | also unstubbed after each file |
| `interceptors.spec` swapped the generated client's adapter and never restored it | restored after each test |
| `session-wiring.spec` redefined `document.location` | a `vi.spyOn` getter, undone by `restoreAllMocks` |

`setupTests.js` now fails a file that starts with `location` replaced and names
the previous file, so the next leak of this kind points at its cause.

**`maxWorkers: '100%'`.** Vitest's default keeps one core back for its main
process, and that process sits near idle here. On 4 cores that is 142 s →
117 s. It matters more on 2 cores, which is what a CircleCI `docker` job gets
without a `resource_class`: there the default meant a single worker
(411 s → 227 s, simulated with `taskset -c 0,1`).

**`npm run test:changed`** runs `vitest run --changed`. A change inside one
Slice (`features/member/member/schemas.ts`) selects 22 spec files. A change to
shared table code selects 168. A change to the main store selects nearly all.

**Input delays are zero in specs.** About a quarter of test time (~80 of ~316
test-seconds) was spent sleeping through the production debounces: 300 ms in
the table kit, 500 ms in the searches and probes. Fake timers are not an option
here, because `settle()`, MSW and happy-dom's fetch all run on real timers,
and faking them freezes the harness. The debounces now read their delay from
`src/services/input-delays.ts`; `setupTests.js` sets it to zero, and 64 spec
sleeps became `settle()`. Five specs are about the delay itself and put the
real one back for their own test. Full suite: 114 s → 92 s.

## Levers that were measured and rejected

**Fewer tests.** Time is not spread evenly over tests, so test count is the
wrong measure:

| kind | files | tests | test time |
|---|---|---|---|
| form screens | 47 | 639 | 134 s (44%) |
| list screens | 36 | 511 | 85 s (28%) |
| other views, panels, components | 97 | 903 | 82 s (27%) |
| schema specs | 21 | 329 | 1.1 s |
| models, services, router, api | 21 | 334 | 0.3 s |

The cheapest half of all tests is 4% of test time. The 13 per-kind user
`*-form-schemas` files that the research note proposes collapsing hold 160
tests and take 0.07 s. Collapsing them is worth doing if it makes them easier
to maintain, but it gains no speed. All the time sits in the ~1,150 tests that
deep-mount a screen (median 64 ms, p90 250 ms, slowest ~1–2 s). Removing a
mounted test saves its real cost, so pruning those is a question of coverage
per test, not of test count.

**Merging spec files.** With `isolate: false` a file costs no import of its
own. The ~0.5 s per file that `environment` still reports is an accounting
artifact: vitest sets the environment up once per worker and reports that
same figure against every file it runs.

**`describe.concurrent`.** Tests in one file share one JS thread, so
concurrency only helps a test that is waiting. With 8 workers on 4 cores the
run took the same wall time (116 s vs 117 s) at twice the CPU. The suite is
CPU-bound. Concurrent tests would also share the one DOM, the toast spy and
the seam's request log.

**`pool: 'threads'`.** Same as `forks` at 4 workers (115 s vs 114 s). Not
worth the switch.

**Essential / non-essential tags.** Vitest 4.1 has tags (`--tagsFilter`), but
a hand-kept "essential" set would drift, and `--changed` already picks the
relevant subset from the module graph. Not added.

**Caching flags.** `experimental.fsModuleCache` was already on, and it cuts
`transform` from ~33 to ~4 CPU-seconds. Since transform was never the
bottleneck, wall time moves by only ~15 s. `cache` (on by default) only orders
files: failed and slow ones first. It skips no work. `--changed`/`related`
are the flags that skip files; see above.

## The isolated specs

Of the 23 files that needed a module graph of their own, 22 now share:

- **vue-loading-overlay** is mocked inert once in `setupTests.js`, like the
  toast (2 files needed nothing else).
- **Websocket mocks** became spies on the socket class or singleton
  (`stubSocket`, `support/sockets.js`; 5 files). `auth-store.spec` mocked
  `forgetSocketRooms` to check it was called; it now checks the effect: a
  room cached before logout is asked for again after it.
- **Legacy HTTP client fakes** (`vi.mock('@/services/api')` +
  `vi.mock('@/api/client.gen')`): five moved to the network seam (NavItems,
  SubNav, OrderTypesPie and, once the schema was fixed, both dashboards), and gained a `settle()` their "no request" claims
  lacked. The others kept their fake for a while, installed by `useFakeHttp()`, which
  spied on the real clients instead of replacing the modules; they have since
  moved to the seam as well (see below). `base-socket.spec` spies on the one `get` it needs.
- **`base-collection.spec`** had no mock at all; a comment mentioning
  `vi.mock` fooled the scan, which now ignores comments.

`user-form-schema-wiring.spec` stays isolated by design: it replaces
`useUserForm` with a recorder to prove each screen passes its own schema
functions, and a named ESM export cannot be spied on.

Sharing a worker surfaced three more leaks, fixed at the source:
`auth-store.spec` also swapped the generated client's adapter (setupTests.js
now restores every client's adapter before each test), and it spied on
`localStorage.setItem`, which happy-dom's Proxy-based `Storage` cannot
restore, leaving the worker's one storage unable to write. `setupTests.js`
now fails a file that starts with a broken storage, naming the file before it.

`useAuthToken` now creates its `useLocalStorage` ref in a detached effect
scope. VueUse ties the ref-to-storage watcher to the scope active at
creation, so a component reading the token first during `setup()` would stop
the token being persisted when it unmounted. That holds in the app as much as
in a shared test worker.

### What the seam found on the dashboards

The seam rejects a request the schema does not declare, and the legacy
dashboard screens sent three:

| screen | request | undeclared | outcome |
|---|---|---|---|
| dashboard (`dashboardMixin`) | `GET /api/equipment/equipment-document/` | `type` | schema was missing it and `equipment__branch` |
| dashboard (`dashboardMixin`) | `GET /api/invoice/purchase/year/` | `year` | schema was missing it |
| CompanyDashboard | `GET /api/member/member/get_dashboard/` | `page` | the backend ignores it |

The backend already honoured `type`, `equipment__branch` and `year`, and the
schema now declares them. The frontend had a bug of its own there: the legacy
`DocumentService` set the branch filter and then the type filter through
`setListArgs`, which replaces, so the dashboard listed every branch's
documents. The three reads now call the generated operations with both
filters in one query and without `page`, and the legacy services behind them
are deleted. Both dashboard specs are on the seam. The facility-documents table
also printed the raw equipment id: it had a cell template for a `location`
column the table does not have. It now links the equipment by name, like the
technical table.

The client fake could see none of this; that is the gap the seam exists to
close.

### The remaining client-fake specs

The eight remaining client-fake specs are on the seam now. Seven went across
without a mismatch: login, logout, the post-login redirect, both no-access
specs, the inventory stats table and the material form. Four of them should
make no request at all, and
now fail if one is made. The login and material-form bodies are also checked
against the generated request schemas. None of them hit a schema mismatch.

The eighth, `material-move-form-call-shape.spec`, hit one: the material
search sends `q` to `GET /api/inventory/inventory-materials/`, which the schema
declared no query parameters for (its sibling `inventory-materials-for-location`
did). The backend filters on it; the schema now declares it, along with the
parameters two other inventory lookups read, and the spec is on the seam too.
Moving it turned up a frontend bug as well: `Inventory.js` put the search term
into the URL unencoded, so a term with `&`, `#` or `+` was cut short or
changed. It is encoded now, and the spec pins it.

With that, no spec uses a client fake; `fake-http.js`, `api-client-mock.js`,
`request-recorder.js` and `resetFakeHttp` are deleted.

## What is left, and what it would take

**CI.** `resource_class: large` (4 vCPU, 20 credits/min against medium's 10)
runs the test step in ~68 s instead of ~113 s, so it costs slightly more
credits per run for about 45 s of speed; not worth it now. Caching
`node_modules/.vite` between runs (keyed on the lockfile) would give CI the
warm transform cache; not done here because the config could not be tested.
