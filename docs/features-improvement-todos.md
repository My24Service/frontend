# `src/features` — improvement todos, ordered by net lines cleaned

Sources: the thermo-nuclear review of `src/features` (2026-09-02, own reads + caller traces + 4 parallel subagents) cross-checked against `docs/Executive Summary & Scorecard by Gemini and Claude.md`. Every file:line below was verified against the tree at `develop` @ `8309c3f5`. Where an item originated in the Gemini/Claude review it is marked **[G]**; items found only in this review are unmarked.

**Metric.** Todos are ordered by estimated *net lines cleaned* (lines deleted or deduplicated, minus new shared-code lines). Estimates are honest ranges, not promises — re-count with `git diff --stat` per todo.

**Suggested execution order differs from this list.** The behavior batch (§12) is only ~40 lines but user-visible and low-risk — do it first. The doc diet (§1) removes the most lines but touches zero runtime behavior. Between those two poles, work top-down.

---

## Summary

| # | Todo | Est. net LOC | Effort | Risk |
|---|------|-------------:|--------|------|
| 1 | Comment & README diet | ~900 | Low | ~Zero (comments/docs only) |
| 2 | Extract the shared form runtime | ~570 | High | Medium (biggest refactor) |
| 3 | Consolidate the schema/validation kit | ~390 | Medium | Low-Medium |
| 4 | Extract the list-screen shell | ~275 | Medium | Low |
| 5 | `ValidatedFormField` component | ~250 | Medium | Medium |
| 6 | `valuesFromRecord` + derived `FormValues` types | ~240 | Medium | Medium |
| 7 | Delete the `list-invalidation` layer | ~160 | Low | Low |
| 8 | Table-engine slimming (dead knobs & surface) | ~140 | Low | Low |
| 9 | Form dead-code sweep | ~120 | Low | ~Zero |
| 10 | Consolidate duplicated micro-helpers (Dinero/FileList/dataURL) | ~40 | Low | Low |
| 11 | Behavior-fix batch (i18n, CSS, sticky row, sort bug) | ~40 | Low | Visual only |
| 12 | Harden `url-query-sync` | ~20 | Low | Low |
| 13 | Centralize `SESSION_AUTH_HEADER` into client middleware | ~15 | Medium | Medium (auth) |
| 14 | `isRequest`/`isCreate` → `FormMode` | ~10 | Low | Low |
| 15 | `DocumentPanel.vue`: decide on TanStack Table | +30 (adds) | Medium | Medium |
| 16 | Migrate feature tests `.js` → `.ts` | ~0 | Low | ~Zero |

---

## Ground rules for every todo

1. Behavior stays identical unless the todo says otherwise. Each slice's README carries a *declared-exceptions ledger* that is load-bearing — code cites it (`MaintenanceContractForm.vue:639`, `DocumentPanel.vue:52,224`) — so ledger rows get updated, never silently dropped.
2. After each todo, the gate is: `npm run typecheck` → `npm test` → `npm run codegen` only if generated sources changed (they should not in any todo here) → for UI-affecting todos, the slice README's manual browser checklist.
3. Mutation testing (`npm run test:mutation`) recorded 100% scores for the files §7 deletes; after that todo lands, update the two README sentences that cite those scores so the ledger stays truthful.
4. Keep every refactor mechanical: one todo per PR/commit where feasible; the per-slice spec files (`tests/unit/features/**`) are the safety net — do not weaken assertions to make a refactor pass.

---

## 1. Comment & README diet — ~900 net lines

**What.** Reduce the 42 doc-blocks over 8 lines in `src/features` to ≤3–6 lines each, collapse cross-file duplication of the same rationale, and cut the two slice READMEs from 244/238 lines to ~90 each *without* deleting the ledgers or the manual checklists.

**Why.** Comments restate what the code, the ADRs, or the READMEs already say; several are stale and therefore actively misleading. This is pure line reduction with zero runtime risk, and it makes the surviving comments load-bearing again.

**The one-canonical-home rule.** Every recurring fact gets exactly one normative location; everywhere else becomes a pointer (or nothing):

| Fact | Canonical home | Delete from |
|------|----------------|-------------|
| DRF `required=True` ⇒ "present and not blank"; generator emits plain `string`; hence `minLength(1)` | ADR-0003 + one line in `member/README.md` rules | The verbatim paragraph pasted into **6** schema headers (`customer/schemas.ts:16-20`, `maintenance-contract/schemas.ts:20-24`, `member/schemas.ts:21-25`, `contract/schemas.ts:14-17`, `module/schemas.ts:16-18`, `module-part/schemas.ts:15-21`) |
| #323 cross-resource invalidation policy ("the writer invalidates what its change makes stale") | `member/README.md` ledger | The 5 other restatements: `member/contract/list-invalidation.ts:5-24`, `member/module-data-invalidation.ts:5-19`, `module/list-invalidation.ts:6-13`, `module-part/list-invalidation.ts:6-13`, `ContractForm.vue:106-113` |
| SESSION_AUTH_HEADER mechanism (simplejwt skips empty header) | `customer/README.md` "The Authorization header" | `session-auth-header.ts:1-17` → 4 lines |
| Raw-SDK exception rationale | `member/README.md:49-63` | `use-company-code-probe.ts:9-32` (24 lines) → 6 |
| URL-sync directions & no-op convergence | `server-paged-list.ts` module doc (keep, trim) | `url-query-sync.ts:7-36` (30 lines) → 8 |

**Steps.**

1. Legacy-narrative headers on all 6 forms + 2 views + DocumentPanel (13–27 lines each; worst: `MemberForm.vue:459-485`, `DocumentPanel.vue:202-225`, `MaintenanceContractView.vue:189-212`, `CustomerForm.vue:424-444`) → ≤5 lines stating only non-obvious invariants; migration history belongs to git, decisions to ADRs/ledgers.
2. The small `list-invalidation` docblocks die with §7 anyway; trim the survivors first so §7 is a pure delete.
3. Barrels `customer/index.ts`/`member/index.ts`: 17–20-line headers → 3 lines (the one-door rule itself lives in the README).
4. Keep, at ≤6 lines, the genuinely load-bearing ones: `CustomerList.vue:186-189` (flexRender vnode quirk), `module-paths.ts:4-8` (wire-encoding example — keep the example, cut the moralizing at `:10-13`), `table.ts:26-31` (v9 filterFn resolution).
5. **READMEs.** `customer/README.md`: delete §"Sorting lives in the URL, not (yet) on the wire" (L75-89 — stale, contradicted by `CustomerList.vue:264-266` and by the file's own L163-167); shorten L26-30, L45-59, L61-73, L153-173; prune superseded ledger rows #1, #19, #33-35; **keep** the wire-grammar section (L32-43) and the ledger. `member/README.md`: delete §"Genuine gaps the review surfaced" (L145-170 — closed-work history); mutation-score section L94-114 → 4 lines (the per-file stats cite since-deleted files); survivor review L116-143 → 5 lines; keep rules 1–5 and the ledger. Extract both manual checklists (43–70 lines each) to `docs/manual-checklists.md`.
6. `npm run lint` will not catch comment rot — eyeball the diff for dropped non-obvious facts (e.g. the variants-are-distinct-cache-entries point in `member/member/list-invalidation.ts:14` is worth its one line).

**Done when.** No comment block in `src/features` exceeds 8 lines except the wire-encoding example; both READMEs ≤ ~90 lines each including ledger; `grep -c "required=True`` paragraph hits one file.

---

## 2. Extract the shared form runtime — ~570 net lines

**What.** Six forms hand-copy the same ~130-line create/edit skeleton: pk prop + `isCreate` + `Number(props.pk)`; the detail query with the identical `enabled` comment; 9 error→toast watchers; the create/update mutation pair with toast + invalidate + `router.go(-1)` (~22 lines each); `isLoading`/`buttonDisabled`; `errors`/`submitClicked`/`submitForm`; `cancelForm`. Extract it once.

**Why.** This is the largest *code* duplication in the slice (≈780 lines → ~160 shared + ~90 glue), and `MaintenanceContractForm.vue` (792 lines — the next 1k-line risk) benefits most. The table kit already proved the pattern; forms never got it.

**How.**

```ts
// src/features/forms/use-resource-form.ts
export function useResourceForm<TValues, TBody>({
  pk,                                // route param (string | number | null)
  retrieve, create, update,          // generated options/mutation factories
  invalidate,                        // (queryClient) => Promise<unknown> — the surviving invalidation concern (see §7)
  fromRecord, empty,                 // record → values, slate
  copy,                              // { fetchError, created, createdDetail, updated, updatedDetail, createError, updateError }
  onSaveError,                       // optional; wire the shared saveErrorReason (below)
})
// returns { isCreate, id, detailQuery, values, errors, submitClicked, saving,
//           isLoading, buttonDisabled, submitForm, cancelForm }
```

- `useRoutePk()` absorbs the pk-prop + `isCreate` + id-computed trio (identical in 6 forms, each with the same "route params arrive as strings" comment).
- `useQueryErrorToast(query, message)` absorbs the 9 watchers (also reused by `CustomerView.vue`, `MaintenanceContractView.vue`, `DocumentPanel.vue`).
- Fold the **shared `saveErrorReason`** (today only `MemberForm.vue:679-688`) into the composable's onError so all six forms surface DRF field errors instead of a generic toast. Pick one mutation-error pattern (onError *or* try/catch — not both; `ContractForm.vue:254-276 + :308-317` currently double-handles).
- Standardize the double-submit guard: `ModuleForm`/`ModulePartForm`/`ContractForm` lack the `saving` re-entry check the others have.
- Each form keeps only: field state, its schema calls, and panel-specific logic.

**Migration order** (one form per commit, smallest first): ModuleForm → ModulePartForm → ContractForm → CustomerForm → MemberForm → MaintenanceContractForm.

**Done when.** No form contains a `watch(detailQuery.data)`→toast block, a create+update mutation pair, or a `cancelForm` implementation; typecheck+tests green; each form's spec still passes unmodified except imports.

---

## 3. Consolidate the schema/validation kit — ~390 net lines

**What.** Three sub-moves in the 7 `schemas.ts` files, all in one kit:

a. **Messages into the schema pipes.** Put the localized copy directly on the strengthenings — `v.pipe(v.string(), v.minLength(1, $trans('Please enter a name')), v.maxLength(255))`. Then `issue.message` *is* the localized copy: `messageFor`'s switches die (including `member/schemas.ts:231-253`'s empty-vs-short companycode logic — valibot message functions receive the issue), and the **raw-English `String(issue.message)` fallback leak** (`customer/schemas.ts:214`, `member/schemas.ts:251`, `maintenance-contract/schemas.ts:98`) disappears for every strengthened field.
b. **One `createFormValidation`** (in `src/features/forms/`): safeParse → first-issue-per-field → `Partial<Record<keyof T, string>>`, plus a thin `parse` passthrough typed `v.InferOutput<S>`. Replaces the five per-slice quartets (`customer/schemas.ts:156-234`, `member/schemas.ts:151-263`, `contract/schemas.ts:53-100`, `module/schemas.ts:46-87`, `module-part/schemas.ts:53-103`). Keep `FIELD_MESSAGES` (pre-submit placeholder copy) as plain data — with the pipes carrying the submit copy it is the only second list left.
c. **Delete the dead and the identity:**
   - `documentCreateSchema`/`documentPatchSchema` (`document-schemas.ts:18-21`) are identity re-wraps — import `vCustomerDocumentWritable`/`vPatchedCustomerDocumentWritable` directly.
   - `MaintenanceEquipmentRow` (`maintenance-contract/schemas.ts:179`) is a pure alias of the generated type — delete.
   - `equipmentRowErrors` (`:211-218`) hand-codes `parseInt > 0` duplicating the schema's own `minValue(0)` (`valibot.gen.ts:12099`) — rewrite as `v.safeParse` over a staged-row schema so the rules have one home.
   - Drop the 10 dead exports (zero external imports, caller-traced): all 8 schema constants (`customerFormSchema`, `customerCreateSchema`, `maintenanceContractSchema`, `maintenanceEquipmentSchema`, `memberFormSchema`, `contractFormSchema`, `moduleFormSchema`, `modulePartFormSchema`) and the unused type exports `MaintenanceContractBody`, `MaintenanceEquipmentBody`, `ContractFormValues` (member/contract). Un-export; keep the locals.

**Keep by design** (documented, not drift): `requireLogo` outside the schema (`member/schemas.ts:224-227`); the two deliberately-widened form-state types (`MaintenanceContractFormValues.customer: number|null`, `ModulePartFormValues.module: number|null`); the strengthenings themselves — the generator emits `customer_id: v.nullish(...)` with no required-ness (`valibot.gen.ts:11201-11217`), so `minLength(1)` until the request-schema correctness ticket lands is correct, not duplication.

**Also add (complementary, not a replacement):** `@valibot/i18n` for the standard issue types the *generator* emits on non-strengthened fields (`maxLength`, `email`, `url`…) — it cannot supply per-field domain copy, so pipes-with-`$trans` and i18n cover different failure surfaces. The upstream ticket for generator required-ness remains the real fix; note for it: `vCustomerCreateWritable.country_code` lacks `maxLength(2)` while the PATCH variant has it (`valibot.gen.ts:11206` vs `:14085`) — currently masked by the local strengthening.

**Done when.** No `messagesFor`/switch remains; `grep -rn "String(issue.message)" src/features` returns nothing; `test:mutation` re-run keeps the schemas at/above their recorded scores.

---

## 4. Extract the list-screen shell — ~275 net lines

**What.** Six `*List.vue` templates repeat the same five blocks (delete-modal, header/toolbar/search, table panel, pagination `v-if`, icons column); extract shared components/helpers.

**How.**

- `ListPageHeader` — h3+icon, `BButton-toolbar`, refresh, search input, Add link (identical except text: `CustomerList.vue:12-42`, MC `:12-36`, Member `:12-44`, Contract `:12-36`, Module `:12-36`, ModulePart `:12-36`). The same skeleton exists in ~40 legacy views — future repo-wide payoff.
- `ListDeleteModal` — owns the `b-modal` **and** the `useListDelete` wiring; screens pass confirm copy + `destroyMutation` + `invalidate`. This also dissolves the addendum's finding that `useListDelete` hard-couples to the template-ref name `'deleteModal'` (`use-list-delete.ts:44`) — an invisible contract that breaks silently on rename.
- `ListTablePanel` — the `app-detail panel overflow-auto > data-table` wrapper + the pagination block with its `v-if="!isLoading"` (identical ×6).
- `createActionColumn(columnHelper, {editRoute?, onDelete})` — the `display({id:'icons', …})` column is hand-built ×6 (`CustomerList.vue:229-238`, MC `:135-149`, Member `:194-204`, Contract `:100-115`, Module `:98-113`, ModulePart `:108-123`).
- `dateColumn('created')` — three screens render raw ISO strings, one wraps in `h('small')` (MC `:131-134`); one formatter, used everywhere.
- Row-type helper: `type ListRow<T> = NonNullable<T['results']>[number]` replaces the six hand-spelled `NonNullable<PaginatedXList['results']>[number]` aliases, and `CustomerList.vue:115-117`'s `Record<string, any>` widener gets the generated `vCustomerBranchView`-based type instead.

**Done when.** Each `*List.vue` reads as: columns + wire extras + screen-specific cells; template under ~60 lines each.

---

## 5. `ValidatedFormField` component — ~250 net lines

**What.** Wrap the common `BFormGroup + input + b-form-invalid-feedback` block: `<ValidatedFormField v-model="…" :label="…" :error="submitClicked ? errors.postal : undefined" label-cols="3">{{ placeholder }}</ValidatedFormField>`.

**Why.** 17 near-identical blocks in `MemberForm.vue` (426-line template), 12 in `CustomerForm.vue` (`:24-216`), several in `ModulePartForm`/`ContractForm`.

**Scope discipline (learned from the Gemini/Claude addendum, agreed):** wrap **only** the common `BFormInput` case first (plus `BFormTextarea` via a prop); leave `VueMultiselect`, `PriceInput`, `b-form-file`, checkboxes unwrapped until proven. A polymorphic wrapper that swallows every input type becomes worse than the boilerplate. Keep `label-cols`/sizes as props, error slot passthrough, and the `errors.field || FIELD_MESSAGES.field()` rendering inside — which is exactly the pattern every block repeats.

**Done when.** `MemberForm.vue` template ≤ ~300 lines, `CustomerForm.vue` ≤ ~280; no behavioral change to `state`/feedback semantics (spot-check both forms' validation rendering in the browser checklist).

---

## 6. `valuesFromRecord` + derived `FormValues` types — ~240 net lines

**What.** Two linked moves that make the schema the single source of truth for form state:

a. **`valuesFromRecord(schema, record)`** replaces the five hand-merges that mirror each schema's key set by hand (`customer/schemas.ts:111-151`, `member/schemas.ts:118-146`, `maintenance-contract/schemas.ts:64-72,163-176`, `DocumentPanel.vue:273-282`; contract needs none). Sketch:

```ts
export function valuesFromRecord<S extends v.ObjectSchema<any, any>>(
  schema: S,
  record: Record<string, unknown>,
  opts: { booleanNullAs?: boolean } = {},   // member needs null → false on its flags
): v.InferInput<S> {
  return Object.fromEntries(
    Object.keys(schema.entries).map((k) => [k, record[k] ?? opts.booleanNullAsFalse ?? undefined])
  ) as v.InferInput<S>
}
```
   Preserves the current semantics (record values win; absent optionals stay absent; `null` kept where meaningful — `branch_partner`, `branch_id`). Display-only fields are re-added by the one-liner spreads they already have.

b. **Derive the restatable types** — where the shapes genuinely agree:
   - `CustomerFormValues` → `v.InferInput<typeof customerFormSchema> & Pick<Customer, 'id'|'num_orders'|'call_out_costs_currency'|'hourly_rate_engineer_currency'|'hourly_rate_partner_engineer_currency'|'price_per_km_currency'>` (39 → ~8 lines). Plain `InferInput` alone is *wrong* here — it drops the display-only fields the template reads (the nuance the Gemini/Claude review missed).
   - `ModuleFormValues` → `Pick<v.InferInput<typeof moduleFormSchema>, 'name'>`.
   - `ContractFormValues`, `MemberFormValues` (with the logo `string|null → string?` narrowing commented), `DocumentRow` → `Pick<CustomerDocument, …> & {id?; file?; storedFile?}`.
   - **Do not derive** `MaintenanceContractFormValues`/`ModulePartFormValues` (deliberate null-widening for the empty slate) — keep handwritten with a one-line why.

**Done when.** Adding a writable field to a generated schema compiles into the form with zero schema-file edits beyond the spread; the five `*FromRecord` functions are gone.

---

## 7. Delete the `list-invalidation` layer — ~160 net lines

**What.** 8 files, 9 exports, 17 call lines. Caller-traced verdicts:

- **Inline (delete file):** `invalidateCustomerListQueries`, `invalidateDocumentListQueries`, `invalidateMemberListQueries`, `invalidateContractListQueries`, and both exports of `maintenance-contract/list-invalidation.ts` (its two call sites already call them back-to-back, `MaintenanceContractForm.vue:688-689` — two direct `queryClient.invalidateQueries` calls read identically). Precedent exists in-slice: `CustomerForm.vue:583-589` (`invalidateBranches`) calls the API directly.
- **Keep/merge (real logic):** the module/module-part composites (list key + `invalidateModuleDataReadModels`, the #323 cross-resource policy) — merge all three files (`module`, `module-part`, `module-data-invalidation.ts`) into one `member/invalidation.ts` with a 3-line comment pointing at the README ledger.

**Why.** The wrappers add an import + a name + a 10–27-line docblock per resource for one expression; `useListDelete`'s `invalidateAfterDelete` callback accepts the direct call unchanged. Update the two README sentences that tout these helpers' mutation scores (§1).

**Done when.** `grep -rn "list-invalidation" src` matches only `member/invalidation.ts`; tests referencing the module-data round trip (`tests/unit/features/member/module-data-invalidation.spec.js`) still pass.

---

## 8. Table-engine slimming — ~140 net lines

**What.** Remove the engine surface nobody uses and the props that only bounce state back:

- Dead config knobs: `columnFilterParam` and `debounceMs` have zero users (`server-paged-list.ts:73,85`) — delete; the bare-name grammar is the only path, and the URL-restore asymmetry it would cause dies with it.
- `globalFilteringFeature` registered with no UI (`table.ts:36`) and the unreachable `onGlobalFilterChange` (`server-paged-list.ts:253-256`, would desync `searchDraft`) — delete both.
- Dead return surface: `sorting, columnFilters, committedFilters, error, rows, urlParams, wireQuery` are consumed by no screen (`:267-280`). Grep the specs first (`tests/unit/features/**`) — delete whatever is unused; keep `wireQuery` only if a spec asserts on it.
- `ServerTablePagination`: drop `pagination`/`count` props (duplicate `table.getState().pagination` and the `rowCount` already in the table instance); every screen destructures them solely to pass them back. `isFetching` stays.
- `getRowId: (row) => String(row.id)` ×6 → engine default (opt-out stays).

**Done when.** Engine config and return type shrink to what screens actually use; all list specs pass.

---

## 9. Form dead-code sweep — ~120 net lines

Pure deletions, no API design, do in one pass per form:

- `MaintenanceContractForm.vue`: the self-defeating overlay `v-if="!isLoading"` on `<b-overlay :show="isLoading">` (L2 — loading currently renders *nothing*; see also §11); `rowTouched` written 5×, never true, never read (`:536,551,560,573,579`); three unused template refs `void`-ed (`:725-734`, plus their `ref="…"` attrs at `:11,74,122`); `cancelForm`/`goBack` twins (`:764-770`); the two hand-rolled `setTimeout` debounce watches (`:477-498, 513-530`) → `refDebounced` from `@vueuse/core` (already a dependency, used by `use-company-code-probe.ts:52`); `console.log` in error paths (`:649, 692`); Submit button missing `:disabled` (`:41-42` — today double-submit is saved only by the broken overlay).
- `CustomerForm.vue`: `customerIdCreated` ref+watch → `computed` (`:505-533`); `syncingOrders` → `copyOrdersMutation.isPending` (`:611-625`).
- `MemberForm.vue`: branches checkbox rendered twice under complementary compound `v-if`s with two ids (`:106, 313-325`) → one computed `showBranchesField`; static `memberTypes`/`isDeletedOptions`/`isRequestedOptions` (`:576-594`) → module consts; empty `<style scoped>` (`:749-750`).
- `ModuleForm.vue:190-191`, `ModulePartForm.vue:264-265`: empty `<style scoped>`.
- `ContractForm.vue`: `values` via `emptyContract()`+assign → one literal (`:296-298`); `toggleModule(moduleId: string, on: unknown)` → boolean (`:235`).
- `MemberList.vue:100-106,127`: `props.variant as VariantKey` → `PropType<VariantKey>`; `CustomerList.vue:115-117` `Record<string, any>` → generated branch type (see §4).
- `MaintenanceContractView.vue`: redundant cast (`:230`); `MaintenanceOrderRow` index-signature escape (`:259-263`); `contract_pk: props.pk` shipping the raw string (`:341`); `? : 0` → `?? 0` (`:346`); `=== true` truthy checks (`:360,365`); `type="reset"/"submit"` outside any `<form>` (`:99-104`); misleading `cancelForm` that neither navigates nor clears staging (`:355-357`); unused `.new-equipment` CSS (`:402-406`); unify the three alignment mechanisms (`:51,132,382`); `CustomerView.vue:97` commented-out markup, dead `order-stats` ref (`:250`), cast-only computeds (`:366-374`), `goToOrdersPage` wrapper vs plain `v-model` (`:351-353`).

---

## 10. Consolidate duplicated micro-helpers — ~40 net lines

- `FileList` extraction shim: `DocumentPanel.vue:358-362` ≡ `LogoUploadField.vue:95-99` → one `fileFromInput`.
- FileReader→dataURL: `DocumentPanel.vue:364-371` ≡ `LogoUploadField.vue:107-113` → one `readAsDataUrl` (also removes `LogoUploadField.vue:109`'s double cast).
- `rowDinero`: `MaintenanceContractForm.vue:602-604` ≡ `MaintenanceContractView.vue:239-241`.
- Staged-row replay ("create/update in row order, then deletes, stop at first failure"): `MaintenanceContractForm.vue:709-721` ≡ `DocumentPanel.vue:416-440` → `replayStagedRows` helper.
- Default-to-first-option watcher: `MemberForm.vue:565-573` ≡ `ModulePartForm.vue:170-178`.
- Longer term (decision, not a todo yet): Dinero string-parsing placement belongs in `PriceInput`-style components rather than form watchers (Gemini's finding; the migration deliberately kept behavior, so schedule with the PriceInput modernization).

---

## 11. Behavior-fix batch — ~40 net lines, user-visible — *do first*

Small, verifiable in the browser checklist:

1. **Untranslated `empty-text` ×6** — the component default is `$trans`'d (`ServerDataTable.vue:124`) but every screen overrides it with raw English (`CustomerList.vue:49`, MC `:43`, Member `:51`, Contract/Module/ModulePart `:43`). → `:empty-text="$trans('…')"`.
2. **Dead BS4 classes ×24**: `mr-1`/`mr-2` → `me-1`/`me-2`, `float-right` → `float-end` (BS5.3 renamed them; Tailwind is `tw:`-prefixed so nothing provides them; `shared.scss:681` redefines `.float-right` as `margin-bottom: 0`). Toolbars currently collapse and icons don't right-align.
3. **Sticky filter-row overlap** (`ServerDataTable.vue:171-177`): both `thead` rows pin at `top: 0`; after one scroll-height the filter row covers the header. Give the filter row `top` = header height (CSS custom property or measured offset).
4. **Sort indicator lies for `contact`** (`CustomerList.vue:223-228`): not in the backend allow-list (`types.gen.ts:17037`). Set `enableSorting: false` now; file the backend ticket to add `contact` to the ordering annotations (mirrors the 2026-08-30 `module_name`/`customer_view_name` annotations work), then re-enable.
5. **Overlay fix** (`MaintenanceContractForm.vue:2`): remove the `v-if` so the spinner actually shows (sibling forms do this correctly).
6. `CustomerForm.vue:197-202`: Contact `BFormInput rows="5"` — `rows` is a textarea prop; use `BFormTextarea` (remarks does, `:211-215`).
7. `CustomerForm.vue:386` copy-paste toast ("Error fetching orders" on the customer query).
8. Autocomplete dropdowns hardcoded `page: 1` ×4 (`CustomerForm.vue:464`, `MaintenanceContractForm.vue:456`, `MemberForm.vue:512`, `ModulePartForm.vue:133`) — lists >20 items are unreachable; add a per-typing query (they already have term refs) or document the limit in the ledger.
9. `CustomerForm.vue:661 + 717`: `SESSION_AUTH_HEADER` passed twice for one call — drop the per-call one (the full middleware move is §13).
10. `b-modal @ok` closes even on failed delete (`use-list-delete.ts:63-70`) — acceptable UX, but note it or await `doDelete` via `:ok-disabled`.

---

## 12. Harden `url-query-sync` — ~20 net lines

- **RESERVED hole** (`url-query-sync.ts:39, 96-99`): any foreign URL param becomes a permanent column filter *and* wire param (echoed back by `write()` `:116-119`). Restrict restore-filters to params the engine actually knows how to map (known columns / `columnFilterParam` at the time) instead of "everything not reserved".
- Clamp restored page against nothing available at restore-time — at minimum clamp on data arrival (page > pageCount → reset to last page) so a shared `?page=999` self-heals.
- Drop the unused returned `params`/`urlParams` (`server-paged-list.ts:275`) unless §8's test-grep finds a consumer.
- Known-accepted risks to record in the ledger rather than fix now: index-coupled `sameFilters`, comma-joined repeated params, and the router-vs-sync hash ownership overlap (`:55,131`).

---

## 13. Centralize `SESSION_AUTH_HEADER` — ~15 net lines, decision-weighted

**What.** The `{Authorization: ''}` workaround (required header documented for mobile clients; empty string passes the generated validator and simplejwt skips it) is scattered across 6 call sites and double-passed once (`CustomerForm.vue:661` factory + `:717` per-call — fix that regardless).

**How.** Register a hey-api client middleware scoped to the customer operations (match by op id or URL prefix) that injects the header — *scoped*, not global, so non-customer ops don't gain a header they never declared. Then delete `session-auth-header.ts` and every per-call header.

**Caveat.** Auth-adjacent and wire-visible (header appears on the wire either way — value is empty, simplejwt skips it, verified). Land behind the full customer manual checklist; keep the README's Authorization section as the record of *why*.

---

## 14. `isRequest`/`isCreate` → `FormMode` — ~10 net lines

`MemberForm` takes `pk` + `isRequest` and branches on nested combinations (`MemberForm.vue:494, 716`) — a three-state mode disguised as two props:

```ts
type FormMode = 'create' | 'edit' | 'request'
const mode = computed(() => props.isRequest ? 'request' : props.pk ? 'edit' : 'create')
```

(Or a `mode` prop supplied by the router files.) Same treatment later for `MemberList`/`ModulePartList`'s `variant`s if a third variant ever appears. Low LOC, real model clarity — from the Gemini/Claude review, conceded.

---

## 15. `DocumentPanel.vue` + detail-view `b-table`s — decide, then convert

`DocumentPanel.vue:13-38` still uses `b-table` (found by the Gemini/Claude review; verified), as do the detail views (`CustomerView.vue:64,98,192`; `MaintenanceContractView.vue:68,111`). These were outside the literal "`*List.vue`" scope of goal 4, but the panel is a datatable and the views are in-slice. This todo *adds* lines (a TanStack instance per table) — it's listed last because it's goal-completeness, not LOC. Decision needed: convert `DocumentPanel` now (client-side data — note the shared kit is server-paged by design; this needs a client-mode table call, i.e. plain `useVueTable` + the kit's column helper, or a `useLocalTable` sibling), or declare the remaining `b-table`s out of scope in the README ledger.

---

## 16. Migrate feature tests `.js` → `.ts` — ~0 net lines

All 24 files under `tests/unit/features/**` are JavaScript while everything they test is typed TS — goal 2 is incomplete on the test side. Do it opportunistically: rename + typed imports when a todo above touches the corresponding spec. Includes the support harness (`tests/unit/support/form-harness.js`, `list-harness.js`, …) and `fixtureFor` helpers, where types pay off most (fixtures vs `valibot.gen` schemas are exactly the drift surface goal 3 worries about).

---

## Explicitly rejected (do not re-litigate without new evidence)

- **"Move `branchCell`/`contractCell` into SFC components"** (Gemini). The 35-line `h()` cell is a byte-faithful legacy markup port inside a column def; render functions are TanStack-idiomatic. Structural wins here are `createActionColumn` (§4) and the shell — take those instead. (If a cell grows logic or needs reactivity, revisit.)
- **"Always derive `FormValues` with `v.InferInput`"** — wrong for `CustomerFormValues` (drops display-only fields; needs `& Pick<Customer, …>`) and for the two deliberately-widened form-state types (§6). Derive where shapes agree; comment the deliberate divergences.
- **"Delete the README ledgers / strip READMEs to ~40 lines"** — the ledgers are cited from code (`MaintenanceContractForm.vue:639`, `DocumentPanel.vue:52,224`); they are the record of *declared exceptions*, i.e. the difference between this migration and an untraceable behavior change. Prune stale rows; keep the mechanism. Checklists move to `docs/`, not away (§1).
- **Global (unscoped) session-auth middleware** — inject only for the customer operations that declare the header, otherwise every unrelated request gains a header (§13).
- **Deleting all 8 invalidation files** — the two module composites carry the #323 cross-resource policy (§7).

---

## Suggested execution order (differs from LOC order on purpose)

1. **§11 behavior batch + §9 dead code** — cheap, visible, zero-risk; makes every later refactor diff cleaner.
2. **§7 invalidation deletion + §1 doc diet** — the quick ~1,060-line win, no runtime surface.
3. **§8 + §12 + §4** — the table engine: slim it, harden URL-sync, then let screens shrink around it.
4. **§2 form runtime, one form per commit** (Module → ModulePart → Contract → Customer → Member → MaintenanceContract), then §5 `ValidatedFormField`.
5. **§3 + §6 schema consolidation** (same files — do together).
6. **§13, §14, §10** — decision-weighted smalls.
7. **§15 + §16** — goal-completeness decisions, schedule when convenient.
