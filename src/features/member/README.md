# The Member Slice — the reference implementation

Eight screens — module-part, module and contract, each list + form, plus the
member list and member form. This directory is what "a finished Slice" means: if you are
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
model, a Shim, or another Slice's internals; the shared schema kit
(`@/models/schema`) is the one thing drawn from `src/models/`, by
`member/wire-defaults.ts`, because deriving a blank shape from a generated
schema is what that kit is for.

One caller reaches past the door: the four legacy screens that still need the
blank member (company Info/Settings/Connector-Gripp, quotation detail)
deep-import `member/wire-defaults.ts`.

### 2. The Shim rule

A Shim lets not-yet-rewritten code keep working against the new world. Three
properties define one:

- **It lives outside the Slice**, beside its legacy callers
  (`src/models/customer/Customer.js` is the current example). Code inside a
  finished Slice contains none — that is what makes this folder worth copying.
- **It derives from the generated schema** (`formDefaults(vMemberRequest)`),
  never restating fields by hand, so a backend rename fails loudly at import
  instead of silently defaulting nothing.
- **Its comment says it is temporary and names what removes it** — the
  Customer Shim, for instance, names the quotation, order, invoice, equipment
  and company screens' own slices.

A Shim is removed once its last importer converts.

### 3. Reads go through query options, writes through mutations

Reads a component displays go through the generated **query options**;
writes go through generated **mutations** that invalidate the affected list
queries *by resource* — a write invalidates every query key of the resource it
changed, including read models other resources display.

The exception, stated as a rule: a call whose result is **neither displayed
anywhere else nor cacheable** may call the generated SDK function directly.
Validation probes and one-shot fetches are the cases. The worked example is
the company-code availability probe (`member/member/use-company-code-probe.ts`):
its verdict shows nowhere but one field's own
state, and caching an "available" from thirty seconds ago would wave through a
code another admin took meanwhile — so it calls
`memberCompanycodeExistsRetrieve` directly, one request, nothing stored. The user Slice's username probe
(`user/use-username-probe.ts`) is the second example:
it calls `companyUsernameExistsRetrieve` the same way.

When in doubt: if you cannot name why the result must not be cached, it is a
query.

### 4. Validation comes from the schema, and stays there

A form parses **the generated request schema as generated**, and the parse
output is the request body — which is why saved bodies contain exactly the
fields the API declares, and readonly response fields die at the parse instead
of riding the wire.

**Read the entry in `src/api/valibot.gen.ts` before writing a rule** —
the rule is usually already there, and an override replaces the generated pipe
rather than adding to it.

`docs/agents/form-schemas.md` is the procedure: which component to parse, how
to add a rule without losing what codegen wrote, where the copy goes, and how
to derive the form-values type. The ledger is `docs/schema-strengthenings.md`: which
rules the Slices still carry, and why each one is permanent.

### 5. The testing bar

- Every spec that touches the network runs through the strict seam
  (`installApiSeam`) — no client fakes. The pure-function suites (`schemas.ts`,
  `module-paths.ts`) sit above the wire and need none. A dropped parameter fails loudly; a fixture the backend could
  not have sent fails too.
- Each **form** pins its whole request list as a literal in its own spec. The
  four **lists** pin their query through the seam instead, key for key.
- Behaviour shared across screens is pinned once where it lives (the
  scaffolding specs) and driven through the DOM everywhere else.
- Mutation testing runs over this folder; the recorded score is the benchmark
  the next Slice should meet or beat.

## Testing notes

Recorded mutation score (StrykerJS, `npx stryker run --mutate
'src/features/member/**'` — vitest runner, perTest coverage analysis, type
checker on): **20 files, 1155 mutants, 62.0% detected (639 of 1030 valid)**.

## Declared exceptions — the ledger

Behaviour the Slice deliberately changed, collected
so a reviewer can tell an intended fix from a refactor bug. URLs moved nowhere;
each screen asserts its routes verbatim.

| Screen(s) | Exception | Why |
|---|---|---|
| Module Part form | Saved bodies drop `module_name` (and `id` on edit) | Readonly response fields; the parse drops them (rule 4) |
| Module Part form | Search term and page live in the URL | State the seam can drop must live somewhere reloadable |
| Module Part form | An empty module list no longer hangs the form | The form guards the empty selection |
| Module list + form | URL-carried search/page (as above); edit PATCH drops `id` | Same rules, applied |
| Contract list + form | Bodies drop `modules_text` and `max_users` (+ `id` on edit) | Read-only / no input rendered; schema-declared writes only |
| Contract writes | Cross-resource invalidation: a writer invalidates read models other resources display | The assignment edge — a contract write must refresh the contract dropdown the Member form reads |
| Member list | Two independent booleans collapsed into one `variant` prop | Two booleans encoded four states, one meaningless; URLs unchanged and asserted |
| Member list | Wire booleans are lowercase `true/false` | The generated client validates queries against the schema before sending; backend filterset reads both spellings |
| Member list | Active variant sends no filters for any role | Backend excludes soft-deleted/requested unless explicitly asked; explicit `true` still shows them |
| Member form | Edit bodies drop `id`, `contract_text`, `companylogo`, `companylogo_workorder_url` | Rule 4 again |
| Member form | Company-code check debounced (500 ms), not per keystroke | Twelve probes for thirteen characters otherwise |
| Member form | Both submit buttons report invalid forms identically | The header Save failed silently; repaired, not preserved |
| Member form | Failed saves surface the API's own reason | DRF `{detail}` / field errors in the toast body, not a bare "Error" |
| (legacy callers) | Ten call sites call the generated SDK directly with `throwOnError` | `throwOnError` keeps their existing catch blocks honest |
| (legacy callers) | CSRF handling moved into the client interceptor | The generated client attaches one token once per session to every unsafe method |
| All lists | Header, panel and delete modal come from the shared table shell | Same toolbar markup, same modal ids, same copy; member list keeps its delete-only icons and variant filters |
| All forms | Runtime comes from the shared `useResourceForm` | Same input ids, same messages, same wire bodies; the Member write-failure toast title is the generic 'Error' now (the body — the API's own reason — is unchanged and specs pin the body) |
| kit | All four lists | The page, the search term and the sort live in the URL | Defaults stay out of the address, and a shared address restores the view — page included — before the first request |
| Member form | The contract select asks for the whole collection (`page_size=1000`), not the API's first page of 20 | The dropdown is filled from this one read, so a tenant past 20 contracts lost choices from it. 1000 is the API's own ceiling (`My24Pagination.max_page_size`, my24service `source/apps/core/rest.py:233-236`), which the DRF paginator clamps a larger value down to rather than rejecting, so one response can never carry more — the bound and its citations are worked through in `src/features/customer/README.md`, "The whole-collection bound". The recording predates the fix and still asks page one alone, so the spec normalises that key |
| Module Part form | The module select asks for the whole collection (`page_size=1000`), not the API's first page of 20 | Same read and same bound as the Member form's contract select: a dropdown cannot page, and a tenant past 20 modules lost choices from it. `My24Pagination.max_page_size` is 1000 (my24service `source/apps/core/rest.py:233-236`; the reasoning is in `src/features/customer/README.md`, "The whole-collection bound"). The recording predates the fix, so the spec normalises that key |

## Manual browser checklist

Walk the Member list against a development tenant after any cross-cutting
change.
