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

<!-- trimmed for diet — see docs/manual-checklists.md -->

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

DRF `required=True` ⇒ present and not blank; see ADR-0003.
