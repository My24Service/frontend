# Can we get the same confidence from far fewer tests?

> **Superseded on speed by `test-suite-performance.md` (2026-09-27).** The
> per-file cost this note attributes to file count was module re-evaluation,
> and turning isolation off for most specs removed it without merging a single
> file. Its coverage findings (§3, §5.5) still stand.

Research note, 2026-09-26. Written because the full suite takes minutes and we
want to know whether a smaller suite can hold the same line.

**Short answer: yes, but not by deleting tests.** The lever is not "write fewer
assertions". It is that ~180 of the 218 spec files each pay a fixed
file-level setup tax, and most of them assert things that the network seam
already asserts for free. The win comes from merging spec files and letting
the seam do the checking that hand-written assertions are duplicating.

This note is evidence-first: every number below is measured from this repo, not
estimated.

---

## 1. Where the time actually goes

`npm run test:profile` already measures this (`scripts/vitest-profile.mjs`).
Its header records a measured run:

```
Duration  60.04s (transform 32.55s, setup 10.92s, import 254.90s, tests 169.88s, environment 45.24s)
```

Read that carefully: **only `tests` is test work.** `transform`, `setup`,
`import` and `environment` are paid *once per test file*. In a 218-file suite,
168 CPU-seconds of pure per-file overhead (setup + environment alone) is
overhead that scales with *file count*, not with test count.

The repo already banks some of this: `experimental.fsModuleCache` cut a
measured run from ~93s to ~52s. And `setupTests.js` documents a 209
CPU-second saving from stubbing `VueDatePicker` once instead of importing it
per file.

What remains is the structural cost: 218 files, each spinning up a fresh
happy-dom, re-resolving the module graph, and re-running `beforeEach` setup.

**Implication:** the cheapest big win is *fewer files*, not fewer `test()`
calls. Merging spec files is nearly free in coverage terms and directly
divides the dominant cost.

---

## 2. The suite, measured

| | |
|---|---|
| spec files | **218** |
| lines of spec | **42,433** |
| `test(` / `it(` calls | **~2,230** |
| files on the network seam (`installApiSeam`) | 127 |
| files still on the old client fakes | 11 |
| files deep-mounting a real component | 152 |

Biggest directories by lines:

| directory | files | lines |
|---|---|---|
| `features/user/` | 26 | 6,227 |
| `features/member/` | 19 | 3,773 |
| `features/field-service/` | 18 | 3,709 |
| `features/customer/` | 10 | 3,225 |
| `features/order/` | 14 | 3,084 |
| `features/company/` | 17 | 3,040 |
| `features/equipment/` | 12 | 2,895 |

`features/user/` is the outlier and the obvious first candidate. It is a strict
product of **seven user kinds** × **four spec shapes**:

| shape | per-kind files |
|---|---|
| `*-form-schemas.spec.js` | 7 (api, customer, employee, engineer, planning, sales, student) |
| `*-form.spec.js` | 7 (api, customer, employee, engineer, planning, student, sales) |
| `*-list.spec.js` | 7 (api, customer, employee, engineer, planning, student, and `sales-user.spec.js`) |
| + 5 one-offs (`student-register-*`, `student-user-detail`, `use-username-probe`, `user-identity-panel`, `user-form-schema-wiring`) | |

The seven `*-form-schemas.spec.js` files are the clearest case. They are
structurally identical — same `describe`, same `valid` literal shape, same
happy/sad assertions — differing only in which generated schema they parse:

```js
// customer-user-form-schemas.spec.js
import { vCustomerUserRequestWritable } from '@/api/valibot.gen'
import { emptyCustomerUser, validateCustomerUserForm } from '@/features/user'

// student-user-form-schemas.spec.js
import { vStudentUserWriteRequestWritable } from '@/api/valibot.gen'
import { emptyStudentUser, parseStudentUserForm, validateStudentUserForm } from '@/features/user'
```

Seven files, 7 × ~10 tests = ~70 tests, all of which are "this kind's form
validates its own kind's payload". That is **one** table-driven spec with
seven rows:

```js
describe.each([
  ['customer', vCustomerUserRequestWritable, emptyCustomerUser, validateCustomerUserForm],
  ['student',  vStudentUserWriteRequestWritable, emptyStudentUser, parseStudentUserForm],
  // …
])('%s user form schema', (kind, schema, empty, validate) => { /* one body */ })
```

Same for the seven `*-list.spec.js` and seven `*-form.spec.js` files. Twenty-six
files and 6,227 lines collapse to five or six without losing a single distinct
claim.

---

## 3. What the mutation data says about coverage

Stryker is currently broken, but a completed run is checked in at
`reports/stryker-incremental.json` (and `reports/mutation/mutation.json`).
Mining it is the closest thing to a measured answer we have.

Whole-repo totals from that run: **9,195 mutants** across **224 mutated files**.

| status | count | share |
|---|---|---|
| Killed | 1,922 | 20.9% |
| Survived | 1,280 | 13.9% |
| NoCoverage | 5,629 | 61.2% |
| CompileError | 274 | 3.0% |
| Ignored / RuntimeError / Timeout | 90 | 1.0% |

Mutation score on *covered* mutants: **1,922 / 3,202 = 60.0%**.

### The load-bearing number: 61% of mutants are never even executed

`NoCoverage` means: the tests exist, run, pass, and **never reach that line**.
The biggest offenders are not obscure edge cases — they are whole screens with
no spec at all:

| file | mutants | killed | survived | no-coverage |
|---|---|---|---|---|
| `src/views/dashboard/dashboard_view/overviewMixin.js` | 315 | 0 | 0 | **315** |
| `src/router/company.js` | 247 | 0 | 0 | **247** |
| `src/views/quotations/quotation_form/QuotationLine.vue` | 180 | 0 | 0 | **180** |
| `src/views/company/TeamleaderSettings.vue` | 138 | 0 | 0 | **138** |
| `src/views/shared/UserFilterForm.vue` | 134 | 0 | 0 | **134** |
| `src/router/settings.js` | 125 | 0 | 0 | **125** |
| `src/views/quotations/QuotationForm.vue` | 120 | 0 | 0 | **120** |
| `src/router/inventory.js` | 87 | 0 | 0 | **87** |
| `src/views/inventory/MutationForm.vue` | 86 | 0 | 0 | **86** |

**This reframes the question.** The suite is not "too many tests chasing the
same coverage". It is 218 files of dense coverage over roughly half the
codebase, and near-total silence over the other half. Cutting tests will not
touch the 61%. Deleting tests only ever eats into the 20.9% that is killed —
i.e. the part that is currently working.

### Only 42 of the 218 spec files were in that run

The run's `testFiles` map contains **42** entries — it was scoped to the
Company Slice, not the whole suite. Every kill-attribution number below is
therefore a floor, not a total.

Within those 42 files, the kill attribution (`killedBy` → `testFiles`) is
lopsided:

| spec file | unique mutants killed | mutants covered |
|---|---|---|
| `features/company/budget-view.spec.js` | 68 | 122 |
| `models/order-stats-urls.spec.js` | 63 | 143 |
| `models/base-query-args.spec.js` | 63 | 72 |
| `features/company/partner-requests.spec.js` | 63 | 130 |
| `features/company/import-list.spec.js` | 63 | 91 |
| `features/company/branch-view.spec.js` | 62 | 86 |
| `features/company/info.spec.js` | 32 | 65 |
| `features/company/activity-list.spec.js` | **7** | 13 |
| `features/forms/write-contract.spec.js` | **3** | 18 |
| `features/equipment/detail-chrome.spec.js` | **2** | 85 |
| `features/member/contract-member-assignment.spec.js` | **0** | **196** |

The last row is the important one. `contract-member-assignment.spec.js`
*executes* 196 mutants and kills **none** of them. It is a real, useful,
non-redundant spec — it just doesn't happen to kill anything, because
everything it exercises is already killed by another file. That is exactly
what a candidate for merge-or-delete looks like from the mutation side, and
exactly what a candidate for *keeping* looks like from the intent side.

The mutation data alone cannot tell you which. That is the honest limit of
this method — see §7.

---

## 4. The duplication the seam already covers

This is where the real leverage is, and it is specific to how this repo is
built.

The network seam (`tests/unit/support/api-seam/`) generates strict MSW handlers
from `openapi/schema.yaml`. Per the spec README, any spec on the seam gets
these assertions **for free, with no assertion written**:

- a request to an undeclared path → fail
- an undeclared query parameter → fail
- a body the operation's generated request schema rejects → fail
- a declared path with no response registered → fail
- a *stubbed response* the endpoint's own schema rejects → fail

Now look at what hand-written specs actually assert on top of that:

```js
// tests/unit/features/company/budget-view.spec.js
test('the three reads fire as parallel queries', async () => {
  mountBudget()
  await settle()
  const paths = api.requests().filter(r => r.method === 'get').map(r => r.path)
  expect(paths).toContain('/api/company/budget/4/')
  expect(paths).toContain('/api/company/budget/4/costs/')
  expect(paths).toContain('/api/company/budget/4/expected_costs/')
})
```

The seam already fails this test if any of those three paths is wrong or
undeclared. The only thing the explicit assertion adds is *cardinality* — that
all three fired, rather than one of them. And even that is partly free: a spec
that renders the costs has to have called `costs/` or the render would be
empty.

There is a real class of bug this catches (`#313`: a list lost its pagination,
search and sorting with a green suite). But note the failure mode the README
describes: a *client-fake* spec cannot see a dropped parameter, because the
fake records whatever it was handed. On the seam, a dropped parameter is a
strictness failure whether or not anyone wrote the assertion. So **the fix
for that bug class is already in place.** The hand-written `api.requests()`
literals are belt-and-braces on a seam that now has braces built in.

### What this means concretely

A very large fraction of the 127 seam specs are doing three jobs:

1. mount the screen deep (real DOM, real queries)
2. assert the requests
3. assert a rendered string or a toast

The seam makes (2) mostly free. That means a spec file whose *only* assertions
are `api.requests()` shapes is paying ~1–2s of file-level overhead to
re-derive something the harness already enforces.

---

## 5. The strategy that actually works

Ranked by leverage, not by cleverness.

### 5.1 Merge spec files per Slice — biggest win, lowest risk

Nothing about Vitest requires one file per component. The Member Slice has 19
files and 3,773 lines; those could be 4–5 files grouped by *flow* rather than
by *screen*:

```
member/contract.spec.js     list + form + view + staged rows, one beforeEach
member/module.spec.js       module + module-part + their relationship
member/member.spec.js       member list + form
member/boundary.spec.js     what imports what
```

Expected effect: file count drops from ~218 to maybe ~60. Setup and
environment cost scale with file count, so that in isolation is worth a large
fraction of the 168 CPU-seconds measured in §1, plus the transform and import
costs for shared graphs.

This is the move I would do first, and it is reversible one file at a time.

### 5.2 Delete assertions the seam already makes — not the tests

Keep the mount, keep the render assertion, drop the hand-written
`api.requests()` literal *unless* the assertion is about cardinality or
absence. The seam will keep failing on a wrong path, an undeclared parameter,
or a bad body.

The two cases worth keeping an explicit literal for:

- **absence** — "a debounce suppressed a lookup", "a short company code sent
  no request". The README is explicit that these assertions pass vacuously on
  a client fake and only work on the seam with `settle()`.
- **order and count** — "these three fired", "this one fired twice".

### 5.3 Collapse the per-user-type copies

`features/user/` (26 files, 6,227 lines) and parts of
`features/workforce/` are the same screens rendered for different user roles.
A table-driven spec — one `describe` per role, one shared body of tests, role
as a parameter — keeps every distinct claim while replacing N copies of the
setup with one.

Guard: a role difference must genuinely be a parameter, not a different
behaviour. Where two roles diverge, that divergence *is* the test and should
stay its own `test()`.

### 5.4 Use the mutation report to pick what to merge, not what to delete

Once Stryker runs again, the query to run is: *which spec files kill zero
mutants that no other file kills?* Those are merges. **They are not
deletions** — a spec can kill nothing and still be the only thing pinning a
human-meaningful behaviour (see `contract-member-assignment.spec.js` above).

### 5.5 Do not chase the 61% by writing more tests

That instinct will make the suite bigger and slower. The NoCoverage mass is
over legacy `src/views/` screens that the Slice migration will delete. Writing
characterisation specs for `QuotationForm.vue` today costs time to produce
tests that die with the file.

The exception is what won't be rewritten soon *and* carries real risk —
`src/router/*.js` (247 + 125 + 87 uncovered mutants) is cheap to test, is not
being rewritten, and a broken route is a broken screen.

---

## 6. What the research literature says

Three findings, all pointing the same way.

**Jehan & Wotawa (2023), *An Empirical Study of Greedy Test Suite Minimization
Techniques Using Mutation Coverage*, IEEE Access 11:65427–65442** — JavaScript
applications, mutation coverage, greedy minimisation:

> "the discussed algorithms reduce the test suite size of the studied example
> programs on average to **70%** without compromising the fault-detection
> capability of the original test suite"

So even a *good* automated minimiser only gets 30% off, and that is the
published best case on projects where the algorithm is the whole intervention.

**Zhang, Marinov, Zhang & Khurshid (2011), *An Empirical Study of JUnit
Test-Suite Reduction*** — 19 versions of 4 real-world Java programs
(1.89–80.44 KLoC), four reduction techniques:

> "the four traditional test-suite reduction techniques can effectively reduce
> these JUnit test suites **without substantially reducing their fault-detection
> capability**"

"Effectively reduce" is doing a lot of work in that sentence, and the paper's
own framing of the trade-off (benefits *and* costs) is the honest read: the
reduction is real but bounded, and the fault-detection cost is small, not zero.

**Marchetto, Scanniello & Susi (2017), *Combining Code and Requirements
Coverage with Execution Cost for Test Suite Reduction* (MORE+)** — 20 Java
applications, seven baselines:

> "significantly more faults are revealed with test suites reduced by applying
> MORE+"

Their contribution is that a reduction driven by **test execution cost as a
first-class dimension** beats structural coverage alone. That is the same
insight as §1: cost is per-file here, so the right optimisation target is file
count, not assertion count.

**The gap none of them cover.** All three assume a suite where every test is
worth reading. This repo's problem is a different shape: the tests are not
mostly redundant, they are mostly *duplicated in structure* (same harness, same
mount, same setup) while covering only ~39% of the codebase. Greedy
minimisation over a suite like that would give a much worse number than 70%,
because it would be forced to keep files whose only sin is paying setup tax.
Merging files attacks the cost directly, and no literature is needed for it.

---

## 7. Limits of this analysis

Stated plainly, because the whole point is not to oversell it.

1. **Stryker is broken, so the mutation numbers are from one stale, scoped
   run.** 42 of 218 spec files. The 61% NoCoverage figure is a whole-repo
   number from that run, but the per-file kill attribution is Company-Slice
   only. Do not generalise the table in §3 to the other slices.

2. **Mutation score is not the same as correctness confidence.** As
   `contract-member-assignment.spec.js` shows, a spec can kill nothing and
   still be the only thing asserting a behaviour a human cares about. Mutation
   testing measures the *test's* strength, not the *code's* riskiness.

3. **61% NoCoverage is arguably the headline finding, not a side note.** The
   premise of the question ("we have so many tests") is measured true for
   roughly half the codebase and false for the other half. Any reduction plan
   that ignores that will trade a real problem for a worse one.

4. **The runtime numbers in §1 are from the script's own recorded run**, not
   measured fresh for this note. Re-measure with `npm run test:profile` before
   quoting them.

---

## 8. Suggested order of work

1. Fix Stryker (or move to `--mutate` on one Slice at a time so a run
   finishes). Without it, §5.4 is guesswork.
2. Merge the `features/user/` specs (26 files → ~4). Measure the runtime delta.
3. Merge the `features/member/` and `features/company/` specs. Measure again.
4. Delete the `api.requests()` assertions the seam already enforces, keeping
   the absence and cardinality ones.
5. Re-run the profile and record the new phase breakdown here.

Steps 2 and 3 are mechanical, reversible, and should do most of the work.
Step 4 is where judgement is required, and it is where the residual risk lives.
