# Order model migration — WORK IN PROGRESS, tests are red

**Delete this file when the migration is finished.**

Branch: `codegen/openapi-models`. Paused mid-task on a budget constraint.

## State as of the pause

Verified just before pausing:

- `npx vue-tsc --noEmit` → **exit 0, clean**
- `npx vitest run` → **15 failed / 436 passed (451)**

The failures are expected and understood. They are listed below with the fix
for each. Nothing here is mysterious — the work is finishing a known list.

Only these are in flux:

| File | State |
| --- | --- |
| `src/models/orders/order-schemas.ts` | Edited, 479 → 391 lines. Parses, typechecks. Believed complete. |
| `tests/unit/models/order-schemas-defaults.spec.js` | **Not yet updated for the new shapes.** This is where the remaining work is. |
| `src/models/orders/Order.ts` | Migrated earlier. Not part of the remaining work. |

Everything else — the whole backend effort, the `My24AutoSchema` fixes, and all
six inventory models — is committed and green. `git checkout` of the three
order files above returns the tree to a working state at any point, at the cost
of redoing this migration.

## Why the tests fail

The generated nested components (`vOrderStatus`, `vWorkorderDocument`,
`vAssignedUserInfo`, `vReportedCodeExtraData`, `vInvoiceInfo`) have **no
per-field defaults** — their fields are required, not `v.optional(...)`. So
`v.parse(Schema, { statuses: [{}] })` now throws where the old hand-written
schema silently defaulted.

That is correct. It was checked against the backend: `OrderStatusSerializer`,
`get_workorder_documents`, `get_assigned_user_info`,
`get_reported_codes_extra_data` and `get_invoices` all emit every key on every
code path — there is no branch that omits one. The old tests asserted a
leniency the API never had.

**So the tests are wrong, not the schema.** But do not apply that conclusion
blindly to a new failure: check whether the backend can actually omit the key
before changing an assertion.

## Remaining work — concrete list

All in `tests/unit/models/order-schemas-defaults.spec.js`, `describe('read
schema defaults', ...)`. Line numbers are approximate.

1. `the workorder url defaults are pinned` (~248) — `expect(parsed.workorder_pdf_url_partner).toBe('')` → `.toEqual([])`.
2. `nested workorder documents require both url and name` (~254) — second assertion should become `expect(() => v.parse(OrderSchema, { workorder_documents: [{}] })).toThrow()`.
3. `nested status rows default their fields` (~265) — `statuses: [{}]` → throw-assertion, or a full row. `OrderStatusSerializer.Meta.fields = ('id','order','status','modified','created')`.
4. `assigned_user_info defaults its fields` (~270) — `[{}]` → throw-assertion. `get_assigned_user_info` always emits `user_id`, `full_name`, `license_plate`.
5. `reported_codes_extra_data rows default their statuscode` (~277) — supply `statuscode`, or throw-assertion.
6. `OrderDetailSchema string defaults are pinned` (~291) — `workorder_url_org_order` `.toBe('')` → `.toBeNull()`.
7. `OrderDetailSchema invoice rows default their fields` (~297) — `invoices: [{}]` → throw-assertion or full row (`id, invoice_id, uuid, preliminary`).
8. `OrderCustomerHistorySchema defaults are pinned` (~307) — expected `workorder_pdf_url_partner: ''` → `[]`.
9. `nested status rows parse` (~325) — input row is missing `order`, now required by `vOrderStatus`. Add it to input and expected output.

Unverified beyond this list: `assigned_user_info accepts the extended booked
variant` (~332) and the `describe('write schemas', ...)` block. They passed
mid-work but not since. The full-suite count of 15 is larger than the 10 in
this file alone, so a few failures live in the other order specs.

**Do not weaken assertions to get green** (`toEqual` → `toContain`,
`expect.any`, deleting cases). Changing a test requires stating what the backend
actually returns.

## Decisions worth not re-deriving

- **`required_users` override is kept deliberately.** It is an unbounded
  `PositiveIntegerField`, so it generates as a bigint-coercing union. That is a
  codegen artifact, not a backend lie. `int(1)` matches the real range. Keep the
  comment.
- **The hand-written nested schemas were deleted, not re-imported.** `vOrder`,
  `vOrderDispatch` and `vOrderDetail` already embed the correct generated
  components in their entries, so no explicit `v*` import is needed.
- **`copied_order_data` is a list**, `parent_order_data` is a single dict that
  can be `{}`. Confirmed in `Order.get_copied_order_data` /
  `get_parent_order_data`.

## Known backend gap — not yet fixed

`Order.get_workorder_url_org_order` (`models/mixins/workorder_pdf.py`) returns
`None` in the common case (no org order), but the schema declares the field
non-nullable — there is no `@extend_schema_field` marking it nullable. Real
responses will therefore contain a `null` the generated schema rejects.

Currently handled frontend-side by giving it a `null` default in
`withDefaults`, which widens the entry to nullable. **The proper fix is a
backend annotation**, in the same style as the rest of the order sweep. Until
then this is the one place the frontend is compensating for the backend.

## Traps

- `withDefaults` throws on a stale/renamed key. The message names the exact key
  — read it, it is precise.
- `withDefaults` treats a `null` default specially: it also wraps the entry in
  `v.nullable(...)`. That widens validation, not just defaulting. Easy to miss.
- `Order.ts` has its own `formOnlyEntries.workorder_pdf_url_partner:
  nullableStr('')`. That is a client-only form field and is **correct as a
  string** — do not "fix" it to match the read schema's array type.

## Regenerating

The frontend generates from the **internal** schema. The flag is not optional:

    cd ../my24service/source
    ../venv/bin/python manage.py generate_schema --include-internal \
        --tenant <schema_name> --file ../../frontend/openapi/schema.yaml
    cd ../../frontend && npm run codegen

See `../my24service/docs/typescript-codegen.md` for the full picture.
