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
| 2 cores, before: default workers (= 1) | 411 s | | |
| 2 cores, after: `maxWorkers: '100%'` | 227 s | | |

All 2,716 tests pass in every configuration. The shared project also passes
with five different shuffled file orders (`--sequence.shuffle.files`).

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

## What is left, and what it would take

**Real debounce waits: ~80 of ~316 test-seconds are idle.** Specs wait out the
production debounces: 300 ms in `use-server-table`, 500 ms in the username,
company-code and search probes. Most of the idle time is in
`column-filter-bar`, `member-form`, the user forms and the lists. Recovering
it means making those delays injectable, as `useCompanyCodeProbe` already
allows (`{debounceMs}`), or using fake timers in those specs. Both touch what
the specs assert, so neither was done here.

**The 23 isolated files.** They cost ~96 CPU-seconds of import for ~27 s of
tests, the largest remaining import cost. They are the specs still on the
legacy client fakes (`vi.mock('@/services/api')`, `vi.mock('@/api/client.gen')`,
the websocket mocks). Moving a spec to the network seam removes its
`vi.mock`, and the spec then moves to the shared project by itself.

**CI.** Two cheap changes to `.circleci/config.yml`, not made here because
they could not be tested:

- cache `node_modules/.vite` between runs (keyed on the lockfile), so CI also
  gets the warm transform cache
- consider `resource_class: large` (4 vCPU) for the test job; the suite scales
  with cores
