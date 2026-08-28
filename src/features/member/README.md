# The Member Slice — the reference implementation

Eight screens — module-part, module and contract, each list + form, plus the
member list and member form — rewritten end to end by tickets #321–#326 under
parent #313. This directory is what "a finished Slice" means: if you are
converting the next resource, copy the patterns you see here and follow the
rules below. They are stated as rules so you do not have to infer them by
pattern-matching.

The architecture itself is decided elsewhere and is not repeated here:
ADR-0002 (feature folders as the unit), ADR-0003 (generated valibot schemas as
the form validator), ADR-0004 (why vertical Slices), ADR-0005 (why the
collection-factory prototype was not promoted). The domain words are in
`CONTEXT.md`.

## The rules

### 1. One door, and it locks behind you

The router imports this Slice only through `./index.ts`. Everything not
exported there is private wiring — query keys, form schemas, per-screen
helpers — and may change without notice. Nothing inside this folder imports a
model, a Shim, or another Slice's internals.

### 2. The Shim rule

A Shim lets not-yet-rewritten code keep working against the new world. Three
properties define one:

- **It lives outside the Slice**, beside its legacy callers
  (`src/models/member/Member.js` is the current example). Code inside a
  finished Slice contains none — that is what makes this folder worth copying.
- **It derives from the generated schema** (`formDefaults(vMemberWritable)`),
  never restating fields by hand, so a backend rename fails loudly at import
  instead of silently defaulting nothing.
- **Its comment says it is temporary and names what removes it** — for ours,
  the company/quotation screens' own slices (#313).

A Shim dies the moment its last importer converts; `src/models/member/
Contract.js` was deleted exactly that way after #325.

### 3. The raw-SDK rule

Reads a component displays go through the generated **query options**;
writes go through generated **mutations** that invalidate the affected list
queries *by resource* — a write invalidates every query key of the resource it
changed, including read models other resources display (the #323 decision).

The exception, stated as a rule: a call whose result is **neither displayed
anywhere else nor cacheable** may call the generated SDK function directly.
Validation probes and one-shot fetches are the cases. The worked example is
the company-code availability probe (`member/use-company-code-probe.ts`):
its verdict shows nowhere but one field's own
state, and caching an "available" from thirty seconds ago would wave through a
code another admin took meanwhile — so it calls
`memberCompanycodeExistsRetrieve` directly, one request, nothing stored, with
the reasoning commented at the call site. Outside the Slice the same rule
governs the legacy callers migrated at #326 (badge counts, `me/`, settings),
which pass `throwOnError: true` because they carry their old try/catch error
handling.

When in doubt: if you cannot name why the result must not be cached, it is a
query.

### 4. Validation comes from the schema

Each form's `schemas.ts` spreads the generated request body's entries and adds
only named strengthenings, each with a reason in place:
`minLength(1)` until the generator emits required-ness (DRF rejects blanks the
schema currently accepts); format rules (`url`, `email`) arrive with the
schema. Field-level messages map from valibot issue kinds. **The parse output
is the request body** — which is why saved bodies contain exactly the fields
the API declares, and readonly response fields die at the parse instead of
riding the wire.

### 5. The testing bar

- Every spec that touches the network runs through the strict seam
  (`installApiSeam`) — no client fakes. The pure-function suites (`schemas.ts`,
  `module-paths.ts`) sit above the wire and need none. A dropped parameter fails loudly; a fixture the backend could
  not have sent fails too.
- Each screen has recorded goldens; a scenario binds every request except the
  keys of a **declared exception**. Exceptions are commented inline with their
  ticket number, listed in the ledger below, and posted on the ticket.
- A scenario the tenant cannot produce skips saying why
  (`tests/unit/golden/blocked.json`) rather than standing up a hand-written
  stand-in.
- Behaviour shared across screens is pinned once where it lives (the
  scaffolding specs) and driven through the DOM everywhere else.
- Mutation testing runs over this folder; the score below is the benchmark the
  next Slice should meet or beat, and the survivor review explains what was
  deliberately left alive.

## Mutation score

Run with StrykerJS over the finished Slice — `npx stryker run --mutate
'src/features/member/**'` (vitest runner, perTest coverage analysis, type
checker on): **20 files, 1155 mutants, 62.0% detected (639 of 1030 valid)**,
with 95 excluded as compile errors, 30 ignored (Vue compiler macros), 7
runtime errors counted against detection, and 61 untouched by any test. Full breakdown: `reports/mutation/mutation.json` /
`index.html`. Two independent runs produced identical counts; treat the figure
as a floor, for the reason under "measurement noise" below. This is the
benchmark: the next Slice should land at or above it under the same config,
with its extracted logic files (schemas, composables, invalidation helpers)
at or above the 78–100% this Slice's manage.

Per-file extremes, for orientation: all five invalidation helpers
(four `list-invalidation.ts` files plus `module-data-invalidation.ts`) and
`module/schemas.ts` score 100%; `module-part/schemas.ts` 82%,
`contract/module-paths.ts` 79%, `route-paged-list.ts` 80%; the list views sit
at 52–59% and `ListPagination.vue` at 0%.

### The survivor review

Survivors are a review list, not a gate. All 323 were read; they fall into
four classes.

**Accepted — display copy and column metadata (≈112).** String/object/boolean
mutations inside the tables' `fields = [{key, label, thAttr, sortable}]`
arrays (87) and untranslated option/toast copy (25). A user would notice;
the unit bar still does not chase them — copy is pinned by i18n key plus the
manual checklist above, and per-string DOM assertions would make every wording
edit a test edit.

**Equivalent within the suite — redundant defence layers (hand-verified).**
The save guard in MemberForm (`saving`) looks load-bearing, but mutating it
away leaves single-submission enforced by the buttons' `disabled` binding on
mutation-pending state; both layers must be broken together to see a failure,
and the suite rightly refuses to care which one did it. Similar overlaps: the
delete-guard conditions (a second click lands on an already-disabled button)
and seed watchers' `{immediate: true}` where every spec awaits settle anyway.

**Suspected measurement noise (spot-checked, one proven).** Some mutants that
existing assertions *do* kill are reported Survived — Stryker's vitest runner
occasionally serves a cached module for a callback executed after an await.
Proof by hand: mutating the "Member has been updated" toast literal to `''`
makes `confirms the update and goes back` fail, yet Stryker reports it
Survived. Roughly ten such toast/error-copy survivors belong here. Do not
trust a survivor that contradicts a spec you can point at; run the mutant by
hand before believing either.

### Genuine gaps the review surfaced

The survivor review left this list; a follow-up pass closed every entry.
Each says where its closure lives.

- `ListPagination.vue` scored 0/19 — nothing asserted the "1–20 of 45" range
  text or its page arithmetic, because the screen specs assert requests and
  routes, which bypass it. Closed by `list-pagination.spec.js`, including the
  collapsed range an out-of-range `?page=` produces instead of numbers that
  drift past the data.
- The company-code floor survived at exactly two characters
  (`value.length >= 2` → `> 2`). Closed by `use-company-code-probe.spec.js`,
  which probes at two; the form spec additionally pins the ticketed half-second
  duration itself, from the side that can fail ("asks only after the ticketed
  half-second of quiet").
- ContractForm's select-all/select-none helpers had no coverage at all.
  Closed by driving them through the module-level checkbox — repaired from a
  dead legacy control into a working toggle on the way — in
  `contract-form.spec.js`.
- `chosenFile`'s native-event branch and `saveErrorReason`'s field-map branch
  were untested (only b-form-file's synthesized event shape and the `{detail}`
  envelope were driven). Closed in `member-form.spec.js`: a bare change event
  carrying its `FileList` under `target`, and a DRF field-map rejection read
  off the toast. The same file now pins edit-mode logo replacement and the
  untouched-edit-sends-no-logos invariant, and that a failed probe does not
  block the save.

## Declared exceptions — the final ledger

Every deliberate behaviour change made while converting this Slice, collected
so a reviewer can tell an intended fix from a refactor bug. URLs moved nowhere;
each screen asserts its routes verbatim.

| # | Screen(s) | Exception | Why |
|---|---|---|---|
| 321 | Module Part form | Saved bodies drop `module_name` (and `id` on edit) | Readonly response fields; the parse drops them (rule 4) |
| 321 | Module Part form | Search term and page now live in the URL | #313: state the seam can drop must live somewhere reloadable |
| 321 | Module Part form | An empty module list no longer hangs the form | Fixed the #320 crash while converting |
| 322 | Module list + form | URL-carried search/page (as #321); edit PATCH drops `id` | Same rules, applied |
| 323 | Contract list + form | Bodies drop `modules_text` and `max_users` (+ `id` on edit) | Read-only / no input rendered; schema-declared writes only |
| 323 | Contract writes | Cross-resource invalidation: a writer invalidates read models other resources display | The assignment edge — a contract write must refresh the contract dropdown the Member form reads |
| 324 | Member list | Two independent booleans collapsed into one `variant` prop | Two booleans encoded four states, one meaningless; URLs unchanged and asserted |
| 324 | Member list | Wire booleans are lowercase `true/false`, not the recordings' Django-style `False` | The generated client validates queries against the schema before sending; backend filterset reads both spellings. Golden comparisons normalise both sides |
| 324 | Member list | Staff-vs-superuser asymmetry kept, characterised not endorsed | Only a superuser sends explicit `is_requested=false&is_deleted=false`; plain staff get soft-deleted rows too (backend filterset applies only present params) |
| 325 | Member form | Edit bodies drop `id`, `contract_text`, `companylogo`, `companylogo_workorder_url` | Rule 4 again; golden diffed with those four keys replaced |
| 325 | Member form | Company-code check debounced (500 ms), not per keystroke | The ticket's requirement; recordings held twelve probes for thirteen characters |
| 325 | Member form | Both submit buttons report invalid forms identically | Legacy header Save failed silently (never set `submitClicked`); repaired, not preserved |
| 325 | Member form | Failed saves surface the API's own reason | DRF `{detail}` / field errors in the toast body, not a bare "Error" |
| 326 | (legacy callers) | Hand-written Member service/model deleted; ten call sites call the generated SDK directly with `throwOnError` | Ticket's purpose; `throwOnError` keeps their existing catch blocks honest |
| 326 | (legacy callers) | CSRF handling moved into the client interceptor | The old service fetched a token per write; the generated client attaches one once per session to every unsafe method. Same wire result, one less thing each caller does |

## Manual browser checklist

The network seam cannot see a control in the wrong place, a missing label or a
broken layout. Walk these against a development tenant with a staff login
(superuser where noted) after any cross-cutting change — and once per new
Slice, as its own version of this list. Checked means done on
______ (date) by ______.

**Module Parts** — `/members/module-parts`
- [ ] List renders name/module/always-selected columns; row edit icons land on the right records
- [ ] Add form opens empty with the module dropdown populated; submit returns to the list showing the new part
- [ ] Edit opens pre-filled; toggling always-selected survives a save
- [ ] Delete confirms, removes the row, toasts success

**Modules** — `/members/modules`
- [ ] List renders; add/edit/delete round-trip like Module Parts
- [ ] Deleting a module that owns parts behaves sanely (backend cascade visible without frontend crash)

**Contracts** — `/members/contracts`
- [ ] List shows name + modules_text columns
- [ ] Form renders the module tree grouped by module with always-selected parts pre-ticked and disabled
- [ ] Ticking parts encodes `module_paths_pks`; save round-trips losslessly (reopen and compare ticks)
- [ ] Delete stops offering the contract in the Member form dropdown afterwards

**Member list** — `/members/members`, `/members/deleted-members`, `/members/requested-members`
- [ ] All three URLs open the same component in their variant; labels ("Member"/"Deleted member"/"Requested member") follow the variant
- [ ] Rows link to the right edit pages; logos render in the first column
- [ ] Pagination works when the tenant has >20 rows; search modal opens, searches, and keeps the term across a page change (URL carries `?page=&q=`)
- [ ] Delete asks, deletes, re-fetches the page you were on
- [ ] Superuser-only controls appear per the characterised asymmetry: Add member on the active list, and the Requested/Deleted selects on the form when editing a member that already is one

**Member form** — `/members/members/form` and `/members/members/form/:pk`
- [ ] Create validates: empty submit shows field-level messages; company logo required on create only
- [ ] Typing a company code goes green/red half a second after you stop typing; taken codes block submit with the message
- [ ] Choosing a logo shows the preview beside "Current image"; editing shows the stored logos
- [ ] Save shows the overlay and disables both buttons; double-click sends one request; failure toasts the API's reason and keeps your typing
- [ ] Success returns to the list already showing the change (no manual refresh)
- [ ] Cancel leaves without saving; header Save and footer Submit behave identically
- [ ] Request flow (the staff route to `/members/members/form`, "Request new member") fixes the request flags and toasts "Request has been created"

**Cross-cutting**
- [ ] No console errors on any screen
- [ ] SubNavMembers badge count updates after approving/rejecting requested members
