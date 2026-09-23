# Order save: engineer assignments in one request

Status: proposed, not started. Written 2026-09-23 so a later session can pick
it up cold. Paths are relative to each repo: `frontend/` (this repo) and
`my24service/` (the Django backend, `../my24service`).

## The problem

Saving the order form is a chain of separate requests, see the `save` hook in
`src/features/order/form/OrderForm.vue` (~line 310-355):

1. the order itself (with its order lines and info lines),
2. one `POST /mobile/unassign-user/{user_id}/` per engineer removed,
3. one `POST /mobile/assign-user/{user_id}/?notify_user=1` per engineer added
   (`src/features/order/form/use-engineer-assignment.ts`),
4. a create / patch / delete per document row (`OrderDocumentsPanel.vue`),
5. optionally `accept`.

Because any step can fail after earlier ones landed, the form carries a lot of
defensive code: panels "replay" only what is left, failures are collected per
part, several failures each get a toast before the first one aborts the save.
That code exists only because the writes are not one unit.

## What was decided

Asked: should documents and engineer assignments be folded into one atomic
save? The answer depends on whether failing together is *desirable*, and on
what the writes set off besides rows.

### Documents stay separate

A document is an attachment, not part of the order. When an upload fails (too
large, wrong type) the order and its engineers are still right; rolling them
back would make the user redo correct work for a file-specific problem that is
retryable on its own. Base64 files also make the request the largest and most
failure-prone one. Nothing is gained by coupling them.

### Engineers: one replace-set endpoint, validated up front

Assigning is not only a row write. Side effects fire *immediately*, not on
commit:

- `my24service/source/apps/user/models.py:48` `assign_order` calls
  `order.set_status(...)` (`apps/order/models/order.py:165`,
  `apps/core/models.py:331`), whose `save()` calls `execute_ttsa()` right away
  (`apps/core/models.py:289`) - the statuscode engine: mails, ICS invites,
  transaction logging.
- `apps/mobile/views.py:44` `AssignUserView` sends a websocket notification
  per order (`notify_user`) and a `dispatch` new-data message.
- There is no `transaction.on_commit` anywhere in the backend.

So wrapping these in `transaction.atomic` does not make them atomic: a rollback
after the fact leaves mails sent and engineers notified about an assignment
that no longer exists. Today's separate requests are clumsy but truthful.

The proposal:

1. **Backend**: a replace-set endpoint for an order's engineers, shaped like
   `CostViewset.replace_for_quotation` (`apps/quotation/views.py:452`,
   `CostReplaceSetSerializer` in `apps/quotation/serializers.py`): the body is
   the full list of user ids; absent users are unassigned, new ones assigned.
   - **Validate everything before writing anything.** The realistic refusal is
     the unassign guard in `apps/mobile/views.py:144` `UnAssignUserView`
     (an engineer with booked hours or materials, ~line 172). Check it for all
     removals first and answer 400 naming the engineers, with nothing written.
   - Then write in one transaction and send the notifications. What can still
     fail mid-way is a database error, which is rare.
   - Answer with the order's resulting assignments.
   - Reuse `apps/mobile/order_assignment.py:16` `assign_order_to_user`, which
     already mirrors `AssignUserView` for one order.
   - Regenerate the schema (see memory / `docs/typescript-codegen.md` in the
     backend: `generate_schema --include-internal --tenant riedel`, then
     `npm run codegen` here).
2. **Frontend**: `use-engineer-assignment.ts` `replay` becomes one mutation;
   the per-engineer loop and its partial-failure bookkeeping go. The
   `UnassignRefused` handling in `OrderForm.vue` (`reasonOf`) maps onto the 400.
   The order save and the documents stay separate requests.

### Later, only if wanted: fold engineers into the order save

That is safe only once status side effects wait for the commit, i.e.
`execute_ttsa()` and the websocket sends go through `transaction.on_commit`.
That touches the whole statuscode engine (every `set_status` caller), not this
form, so it is its own decision and its own change.

## Where to start

Backend test first, next to `apps/mobile/tests/`: a replace-set that removes an
engineer with booked hours is refused with nothing written and no
notification sent (mock `send_user_notification` / `execute_ttsa`). Run with
`--reuse-db -o addopts=` (the `--flake8` in `pytest.ini` is stale).
