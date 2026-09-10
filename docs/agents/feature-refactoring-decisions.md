# Feature refactoring plan - Phase 0 decisions

The four gate decisions from `docs/agents/feature-refactoring-plan.md` (Phase 0),
each with the evidence it rests on. Every line reference was re-read against the
working tree on branch `feature/refactor-account-slice` before being written down;
where the plan's own line numbers had drifted, the current one is given.

## 0.1 The customer contract field - the wire carries `sum_tariffs`

**Decision.** The maintenance-contract response carries `sum_tariffs` and no
`contract_value`. Unit 1.1 stands: render `sum_tariffs`, delete the invented type.

**Evidence.**
- `openapi/schema.yaml:37014-37052` - the `MaintenanceContract` schema lists
  `id, customer, name, customer_view, sum_tariffs, remarks, created_orders,
  num_order_equipment, num_equipment, created, modified`; there is no
  `contract_value` property at all.
- `src/api/valibot.gen.ts:3686` - `sum_tariffs: v.union([v.number(), v.string()])`.
- `src/features/customer/customer/CustomerView.vue:118` renders
  `EUR {{ data.item.contract_value }}`, and `:345` invents
  `type ContractRow = MaintenanceContract & {contract_value?: string}` with a cast
  at the call site, which is what let the phantom field type-check.
- The only other `contract_value` hits in `src/` are a form field id string
  (`MaintenanceContractForm.vue:117,121`), not a model field.
- Background: the backend dropped the column in migration 0009 (project memory,
  customer slice note of 2026-08-28).

**Consequence.** Unit 1.1 is executed: `sum_tariffs` is formatted through the
dinero helpers exactly as `MaintenanceContractList.vue:69-92` does, `ContractRow`
and its cast are deleted, and the view spec fixture sends `sum_tariffs`.

## 0.2 `urlSync` for the member and user lists - lost in the kit conversion

**Decision.** Enable `urlSync` where the behaviour existed and was dropped: the
four member lists, the customer slice's contract list, and - see the correction
below - the seven user lists too. Unit 6.1 implemented the first two; the user
lists are a follow-up with the same shape. Unit 1.4 is the prerequisite (restoring
a URL must not snap the page back to 1).

**Correction (2026-09-10, after unit 6.1).** The first version of this record said
the user lists "never had it" and that their README claims were stale from birth.
That is true of the converted screens only, not of the behaviour they replaced.
The legacy sales list read the page out of the route on creation - `created() {
this.model.currentPage = this.$route.query.page || 1 }`
(`git show 4f9573e5^:src/views/company/UserSalesList.vue:136`) - and the legacy
`Pagination` component pushed it back on every page change
(`this.$router.push({query: {...this.$route.query, ...this.model.getQueryArgs(),
page: val}})`, `git show 4f9573e5^:src/components/Pagination.vue:44-51`), where
`getQueryArgs()` carries `page` and `q` (`git show 4f9573e5^:src/models/base.ts:301-307`).
So by this decision's own criterion the seven user lists are the same loss as the
member ones and get the same treatment; what unit 6.1 corrected in
`user/README.md` was the claim's wording, not a behaviour that never existed.

**Evidence.**
- Only `src/features/customer/customer/CustomerList.vue:212` passes `urlSync: true`
  today; `src/features/table/server-paged-list.ts:58` declares the option and `:126`
  consumes it.
- `git log -SuseRoutePagedList --all -- src/` finds it added by `e00becf8` (member)
  and `b92944f7`/`ec5d6a33` (customer), and removed by `a8ea251f` ("Promote the
  TanStack Table lists to the real list screens", 2026-09-02). That commit's message
  says `paged-list-screen.ts`, `route-paged-list.ts` and `ListPagination.vue` "have
  no consumers left in either Slice and are deleted" - the URL state those helpers
  kept went with them, because the replacement screens were not given `urlSync`.
  That is a loss, not a decision.
- The converted user screens never had it: `src/features/user/*/*UserList.vue`
  (sales, student, planning, api, employee, customer, engineer) were written
  straight onto `useServerPagedList` with no `urlSync`. The legacy screens they
  replaced did keep the page and `q` in the route query (see the correction above),
  so the README claims (`user/README.md:96` and the copies) described the old
  behaviour and the conversion dropped it.
- `tests/unit/features/customer/customer-list.spec.js` is the only spec asserting
  `window.location.hash`, and is the reference pattern for the new URL-restore specs.

## 0.3 `docs/schema-strengthenings.md` - fold it into `form-schemas.md`

**Decision.** Do not recreate the file. The surviving strengthenings become a ledger
inside `docs/agents/form-schemas.md` step 6 ("Classify what survived"), and the four
citations are repointed at it. Unit 6.2 executes this.

**Correction (2026-09-10, after unit 6.2).** The file was never lost, and this
decision is reversed. It was sitting in a stash: `git show
'stash@{3}:docs/schema-strengthenings.md'` is a 160-line document, and a second,
later revision of the same document sits in `stash@{2}`. Neither `git log
--all -- docs/schema-strengthenings.md` nor a search of the working tree can see
either one — a stash entry is a commit reachable only through
`refs/stash`'s reflog, on no branch and in no other ref — so "returns nothing"
was evidence about *reachability*, not about existence, and the "forward
reference that was never honoured" reading in the evidence below is wrong. The
file has been restored from the stash as the single authoritative record, and
`form-schemas.md` step 6 now points at it instead of holding a copy. Everything
the fold got right survives in it (the eleven case-2 rules, each quoted against
its generated entry) and it carries what the fold could not: the two case-1
entries — the 500-instead-of-400 `KeyError` on user `email`, and the
`country_code` introspection gap — each with the per-item frontend site, the
exact serializer change, the blast radius and the follow-up. The evidence bullets
stay as written; the last of them, "the ledger is the authority if the two ever
disagree", now names a file that exists.

**Evidence.**
- The file has never existed in any git ref: `git log --oneline --all --
  docs/schema-strengthenings.md` returns nothing, and there is no such path on disk.
- All four references were written on the same day as the files that cite them
  (`06220fc1`, `d0c559f5`), so this is a forward reference that was never honoured,
  not a file that was deleted: `src/features/member/README.md:81`,
  `src/features/customer/customer/schemas.ts:16`,
  `docs/adr/0003-generated-valibot-request-schemas-as-the-form-validator.md:96`,
  `docs/agents/form-schemas.md:136`.
- `docs/agents/form-schemas.md:129` already has "### 6. Classify what survived",
  which is exactly the classification the missing file was supposed to record, and
  `src/features/user/api/schemas.ts` already cites "the second case in
  docs/agents/form-schemas.md" - the precedent for putting the ledger there.
- The ledger unit 6.2 wrote into `form-schemas.md` step 6 lists **eleven**
  surviving strengthenings, every one case 2 (the API must be lax, the form need
  not be): member x2, customer x5, user x2, account x2. The count first recorded
  here came from a sweep that missed the patch-level `v.required`, the
  maintenance-contract equipment unwrap and `times_per_year` rule, the engineer
  `preferred_location` check and the account set-password confirmation. Each entry
  in the ledger is checked against its generated entry, so the ledger is the
  authority if the two ever disagree again.
- Zero entries are case 1, which is why no serializer work is scheduled.

## 0.4 The refresh reload - keep it

**Decision.** Keep `window.location.reload()` after a successful refresh. Unit 7.3
is therefore unaffected (it can move the token to one source without changing the
refresh flow). No spec changes.

**Evidence.**
- `src/features/auth/store.ts:107-116`: `refreshToken()` reads the stored token,
  posts it, `authenticate(result.data.token)`, then reloads.
- It has exactly two callers, and both are re-bootstrap paths rather than a user
  action:
  - `src/features/auth/TokenRefresh.vue:60` - the on-mount + 15-minute timer that
    refreshes when the token is within `EXPIRE_REFRESH_THRESHOLD_SEC` (12 h) of
    expiry (`:14-15`, `:52-66`).
  - `src/components/TheIndex.vue:46-50` - `onMounted` `checkInitialData()` throwing
    401, i.e. the app booted against an expired token and refreshed to recover.
- Only `login()` calls `useMainStore().resetInitialDataFetched()` (`store.ts:94-105`);
  the refresh path has no equivalent, so without the reload the app would keep
  serving the anonymously fetched initial data with a valid new token in storage -
  a logged-in-looking shell on stale data. Dropping the reload means rebuilding that
  re-bootstrap, which is a behaviour change this plan does not ask for.
- `tests/unit/features/auth/auth-store.spec.js:103-115` pins the reload
  (`vi.stubGlobal('location', {reload})`, `expect(reload).toHaveBeenCalled()`).
- The cost is bounded: the sliding token lives 2 days and the threshold is 12 h, so
  at most one reload per refresh cycle, and the reloaded page comes back with a
  token that is no longer near expiry.

**Residual concern (recorded, not fixed).** A timer-driven refresh can reload the
page while a form is being filled in. It is pre-existing, rare (once per ~1.5 days
of continuous use), and out of scope here; a conditional reload for the timer path
would need the re-bootstrap replacement above to be safe.

## 0.5 (raised during unit 7.4) the generated jwt-token op cannot carry `app`

**Decision.** Keep the raw `client.post('/jwt-token/', ...)` call and parse its
response with valibot; do not switch to the generated op. Unit 7.4's completion
wording ("`store.ts` makes no raw `client.post('/jwt-token/...')` call") is
therefore met in spirit - the boundary is typed and a token-less response throws -
but not in letter.

**Evidence.**
- `src/api/types.gen.ts:21421-21433` types the generated body as
  `TokenObtainSlidingSerializerDifferentTokenRequest` = `{username, password}`,
  and its 200 response as `unknown`; `src/api/valibot.gen.ts:10202-10205` is the
  same shape, and `src/api/sdk.gen.ts:7126-7131` validates the body with it.
- The app sends a third field: `{username, password, app: 'web'}` (`store.ts:95-99`).
- The backend needs it: `my24service/source/apps/core/views.py:499-508` reads
  `request.data.get('app')` and picks a different session expiry for anything that
  is not `'web'`. Using the generated op would strip `app` before the request left
  the client - a silent session-lifetime change, not a typing exercise.
- Both responses are now parsed with one local `v.object({token: v.string()})`, so a
  body without a token throws at the boundary instead of storing `undefined`.

**Follow-up for whoever owns the API contract.** Either add `app` to the login
request schema in the backend's OpenAPI annotation and regenerate, or drop the
generated-op route for login permanently and say so in `form-schemas.md`'s
neighbouring notes. Until then the raw call is the honest implementation.
