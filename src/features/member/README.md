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
- **It derives from the generated schema** (`formDefaults(vMemberRequest)`),
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

### 4. Validation comes from the schema, and stays there

A form parses **the generated request schema as generated**, and the parse
output is the request body — which is why saved bodies contain exactly the
fields the API declares, and readonly response fields die at the parse instead
of riding the wire.

The `minLength(1)` strengthenings this rule used to prescribe are gone. They
were a stopgap for a generator that did not emit required-ness (ADR-0003's
last consequence); `COMPONENT_SPLIT_REQUEST` on the Django side closed that
gap. **Read the entry in `src/api/valibot.gen.ts` before writing a rule** —
the rule is usually already there, and an override replaces the generated pipe
rather than adding to it.

`docs/agents/form-schemas.md` is the procedure: which component to parse, how
to add a rule without losing what codegen wrote, where the copy goes, and how
to derive the form-values type. `docs/schema-strengthenings.md` records which
rules the Slice still carries and why each one is permanent — every case where
the API was the laxer party has been fixed on the backend.

### 5. The testing bar

- Every spec that touches the network runs through the strict seam
  (`installApiSeam`) — no client fakes. The pure-function suites (`schemas.ts`,
  `module-paths.ts`) sit above the wire and need none. A dropped parameter fails loudly; a fixture the backend could
  not have sent fails too.
- Each **form** has recorded goldens; a scenario binds every request except the
  keys of a **declared exception**. Exceptions are commented inline with their
  ticket number, listed in the ledger below, and posted on the ticket. The four
  **lists** have none: their recordings were taken from the b-table screens the
  shared table kit replaced (`a8ea251f`) and ask for no `page_size` where the
  kit always sends one, so they were retired rather than normalised into
  agreement (`tests/unit/golden/README.md`). The lists pin their query through
  the seam instead, key for key.
- A scenario the tenant cannot produce skips saying why
  (`tests/unit/golden/blocked.json`) rather than standing up a hand-written
  stand-in.
- Behaviour shared across screens is pinned once where it lives (the
  scaffolding specs) and driven through the DOM everywhere else.
- Mutation testing runs over this folder; the recorded score is the benchmark
  the next Slice should meet or beat.

## Testing notes

Recorded mutation score (StrykerJS, `npx stryker run --mutate
'src/features/member/**'` — vitest runner, perTest coverage analysis, type
checker on): **20 files, 1155 mutants, 62.0% detected (639 of 1030 valid)**.
Full breakdown: `reports/mutation/mutation.json`. The figures predate the move
to the shared TanStack Table kit (`route-paged-list.ts`, `paged-list-screen.ts`,
`ListPagination.vue` and the b-table list views are gone). Stryker's
`--incremental` cache lies after a test-setup change — delete `.stryker-tmp/`
before trusting a rerun.

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
| 324 | Member list | Wire booleans are lowercase `true/false`, not the recordings' Django-style `False` | The generated client validates queries against the schema before sending; backend filterset reads both spellings. The recording that showed the old spelling was retired with the rest of the list goldens (rule 5) |
| 324 | Member list | Staff-vs-superuser asymmetry kept, characterised not endorsed | Only a superuser sends explicit `is_requested=false&is_deleted=false`; plain staff get soft-deleted rows too (backend filterset applies only present params) |
| 325 | Member form | Edit bodies drop `id`, `contract_text`, `companylogo`, `companylogo_workorder_url` | Rule 4 again; golden diffed with those four keys replaced |
| 325 | Member form | Company-code check debounced (500 ms), not per keystroke | The ticket's requirement; recordings held twelve probes for thirteen characters |
| 325 | Member form | Both submit buttons report invalid forms identically | Legacy header Save failed silently (never set `submitClicked`); repaired, not preserved |
| 325 | Member form | Failed saves surface the API's own reason | DRF `{detail}` / field errors in the toast body, not a bare "Error" |
| 326 | (legacy callers) | Hand-written Member service/model deleted; ten call sites call the generated SDK directly with `throwOnError` | Ticket's purpose; `throwOnError` keeps their existing catch blocks honest |
| 326 | (legacy callers) | CSRF handling moved into the client interceptor | The old service fetched a token per write; the generated client attaches one once per session to every unsafe method. Same wire result, one less thing each caller does |
| kit | All lists | Header, panel and delete modal come from the shared table shell | Visual no-op: same toolbar markup, same modal ids, same copy; member list keeps its delete-only icons and variant filters |
| kit | All forms | Runtime comes from the shared `useResourceForm` | Visual no-op: same input ids, same messages, same wire bodies; the Member write-failure toast title is the generic 'Error' now (the body — the API's own reason — is unchanged and specs pin the body) |

## Manual browser checklist

`docs/manual-checklists.md` — walk the Member list against a development
tenant after any cross-cutting change.
