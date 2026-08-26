# 2. Feature folders as the unit of a rewritten Slice

Date: 2026-08-25

## Status

Accepted.

## Context

A Slice is one view directory, the model directory it owns, and every route
that mounts them (CONTEXT.md). Until now that unit existed only as a convention
scattered across three places: screens in `src/views/member/`, hand-written
models in `src/models/member/`, and route definitions in `src/router/member.js`
importing the views by deep path. Nothing in the tree said which files belonged
together or where a Slice ended.

The cost of that showed up twice over. The Module Part form reached into a
module-level singleton owned by the Modules list (`moduleModel.searchQuery`),
and inherited whatever search term had been typed on a different screen —
possible only because the boundary between the two screens' state was implicit.
And the abandoned horizontal migration showed what happens when there is no
unit to convert: one layer at a time across every area at once, with no
directory that was ever finished.

The rewrite needs the opposite property: one directory per Slice that can be
read end to end, converted completely, and pointed at as the example.

## Decision

A rewritten Slice lives in a **feature folder**, `src/features/<slice>/`. The
folder holds the Slice's screens, its query and mutation wiring, and its form
schemas. An **index module** at its root defines the Slice's public surface:
the router imports through it, and nothing outside the folder reaches past it.
Anything not exported is private wiring and may change without notice.

Conventions inside the folder, established with the Module Part slice (#321):

- Every component is `<script lang="ts" setup>`. Translation is imported as a
  function (`$trans` from `@/utils`), not reached through a global property.
- Reads a component displays go through the generated query options; writes go
  through mutations; writes invalidate the affected list queries.
- Per-screen logic stays inline in its component. Extract a composable when a
  second caller appears, or when query wiring is substantial enough to test on
  its own — not by reflex.
- No Shim survives inside the folder. A Shim may sit here temporarily during
  the work; it does not survive the ticket.
- Tests stay in `tests/unit/`, mirroring the feature path. Co-locating tests is
  a separate migration with its own tooling questions.

Unrewritten screens stay where they are. The router bridges the two worlds
without ceremony: it imports converted screens from `@/features/<slice>` and
legacy ones from `../views/`, until each ticket moves the next batch.

## Alternatives considered

**Keep `views/` + `models/` as-is and call that a Slice.** No new machinery,
but the unit remains invisible — the Module Part leak came exactly from one
screen reaching into another's module because nothing said it should not.
Rejected: the point of the rewrite is a unit you can point at.

**One folder per screen.** Finer-grained, but a Slice's shared decisions (its
query keys, its form schemas) would then live in a parent directory nobody
owns. The resource, not the screen, is the unit the backend's API suggests.

**Co-locate tests beside the screens now.** Attractive in the abstract; it
drags Stryker globs, vitest include patterns and CI wiring into a ticket whose
job is to establish the runtime patterns. Deferred deliberately, recorded here
so the deferral does not read as an oversight.

## Consequences

- A reviewer reads one directory per Slice instead of four disjoint trees.
- The public surface makes accidental reach-ins importable-only-by-review:
  crossing the boundary requires importing past an index that exists to say no.
- Two homes coexist during the rewrite (`src/views/` legacy,
  `src/features/` converted). That ends when the last Slice converts.
- The Module Part dropdown leak is gone structurally, not patched: vue-query
  keys per screen, and no singleton spans screens any more.
