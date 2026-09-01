# 4. Vertical Slices instead of the horizontal migration

Date: 2026-08-26

## Status

Accepted. Supersedes the horizontal migration plan this repository worked
under from roughly August 2025 to August 2026.

## Context

The rewrite began horizontally: one layer at a time across every area at once.
"Move 1" was to replace every hand-written service call with the generated SDK,
leaving views and models otherwise untouched; later moves would swap the leaves
(the views) and then retire the spine (`BaseModel`) once nothing held it up.
The work and its notes live on the archived branch
`archive/horizontal-migration-poc` (commit `75aafd67`; a pointer created at
#327 to what the working tree had called
`worktree-agent-a955dfbc5e8176807`). On it:

- `move1-call-shape-regressions.md` — the Move 1 findings document, written
  against commit `b8c06b9a`. It is the most important artefact of the whole
  abandoned effort, because it caught the failure mode that reshaped
  everything downstream.
- `ORDER-MIGRATION-WIP.md` — an earlier pause-note from the same horizontal
  instinct one layer down: migrate every model to generated schemas, paused
  mid-task with a red suite and a "delete this file when finished" banner.
- `501993ec` — the call-shape characterisation specs written to catch exactly
  the regressions the move kept producing.

The headline finding in `move1-call-shape-regressions.md`: CustomerView had
lost its `page`, `q`, `order_by` and `since` query parameters. Pagination,
search and sorting on that list were likely broken, the suite was green at
709/709,
and nothing in the tree could see it — the refactor had swapped *how* requests
were built while asserting whatever the new code happened to send. Every entry
in that document is a request that changed shape silently. The suite could not
catch them because it asserted above the code that builds requests; closing
that hole became the strict network seam (#313, first run at #318).

The deeper problem was structural. After a year of moves, no directory was
ever finished. Each pass left every screen half-migrated — in the words of the
branch's own commit `3b4410b9`, "that is what 'converted' has meant so far
almost everywhere: leaves swapped, spine untouched." There was no unit you
could read end to end, point at as done, or copy from. Progress was measured
in layers touched, not screens retired, and the end state receded as the
surface grew.

## Decision

The rewrite proceeds in **vertical Slices**: one resource at a time, taken all
the way — screens, query wiring, form validation, router re-pointing, tests at
the network seam, deleted legacy code and Shims — until that resource owes
nothing to the old world (CONTEXT.md "Slice"; ADR-0002 for the feature-folder
unit). The Member Slice is the reference implementation (#321–#326), closed
out by #327's README, mutation score and manual checklist.

A Slice ticket is not done when its screens work; it is done when someone new
can copy its patterns without reading any other part of the rewrite.

## Alternatives considered

**Continue the moves.** Move 2 and 3 would have repeated Move 1's trade:
visible layer-wide motion, invisible per-screen risk, and still no finished
thing. The regression notes themselves argued for the opposite — each finding
needed a per-screen decision, which is per-screen work either way.

**Big-bang rewrite.** Replace the whole frontend in one go. Rejected without
ceremony: the application keeps shipping while the rewrite runs, so the two
must coexist route by route. That constraint is what makes vertical the only
shape that terminates.

**Finish the spine first** (the collection-factory track on the same archive
branch — see ADR-0005). Attractive because it removes duplication "once".
Rejected: it is the horizontal instinct again, and its own history shows the
cost — months of foundation work with zero screens retired.

## Consequences

- Two worlds coexist until the last Slice converts: converted screens under
  `src/features/`, everything else in `src/views/` + `src/models/`. The router
  bridges them; ADR-0002 records the convention.
- Each Slice lands with its own evidence — seam specs, goldens, declared
  exceptions — instead of one giant regression list at the end.
- The Move 1 findings were not wasted: the strict seam exists because of them,
  and several Move 1 migrations (nav badges, dashboard mixin, partner search)
  were completed verbatim during #326 when the Member model died.
- The archive branch stays for the archaeologist. Nothing on it is merged;
  its ideas survive only where a later ADR says they did (ADR-0005).
