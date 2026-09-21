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

## Amendment (2026-09-10): the index rule applies to Slices, not to kits

The decision above says "nothing outside the folder reaches past" the index. That
rule was written for **Slices** - a view directory, the models it owns, and the
routes that mount them - and it is enforced there: the router and every other
consumer import `@/features/<slice>`.

It does not fit the three **kits** that grew out of the rewrite,
`src/features/forms/`, `src/features/table/` and `src/features/shared/`. A kit
is not a Slice: it has no routes, owns no model directory, and exists only to be
consumed by Slices. Three facts settled the question:

- A kit's consumers need most of its surface, so a barrel would be a re-export
  list of nearly every module in the folder - indirection without a boundary.
- The barrel would have to grow with every kit module a Slice legitimately needs,
  which is the opposite of the "small, domain-agnostic interface" the rewrite
  asks for.
- The reach-in the rule protects against is a Slice reaching into another
  Slice's private wiring. There is no second Slice to protect here.

So the convention is now explicit and uniform:

- `src/features/<slice>/` - imported through its `index.ts`, as decided above.
- `src/features/<kit>/<module>` - imported by module path, for example
  `@/features/table/table` or `@/features/forms/validation`. As written then, no
  kit had an `index.ts`, and adding one meant revisiting this amendment - which
  is what happened for the table kit on 2026-09-11, corrected below. (The
  example used to name `@/features/table/server-paged-list`, which ADR-0006's
  consolidation deleted; a kit's module list is allowed to change, the import
  convention is what this amendment fixes.)

### Correction (2026-09-11): the table kit has a door

The second bullet above is now half wrong, and it is corrected here rather than
deleted, because the reasoning that produced it is still the reasoning for every
kit that does not look like the table kit. `src/features/table/index.ts` exists
and is that kit's public surface. The three reasons above did not survive
contact with a kit that grew both internals and many consumers:

- **A screen was naming one concept across four paths.** Every one of the
  thirteen list screens imported five lines - `ServerTable.vue`, `table`,
  `server-paged-list`, `use-server-table`, `list-columns` - to build one list.
  That is not a boundary a reader can see; it is one concept spelled out four
  times, and it grew a line every time the kit gained a module. The door names
  it once, and a screen's import list became one line.
- **The kit now has genuine internals.** The first reason above assumed a barrel
  would be a re-export list of nearly every module - indirection with nothing
  left private. That is no longer true of this kit: the `hook`, the URL mirror
  (`url-query-sync.ts`), the delete plumbing (`useListDelete`) and the wire
  envelope (`PagedEnvelope`) are its own wiring, and `ListPageHeader` and
  `ListDeleteModal` have no consumer outside it. A door that keeps them private
  expresses a boundary instead of restating the folder.
- **The hazard the third reason protected against does not apply to this kit.**
  The barrel that hurt this repository earlier (the auth barrel) was dangerous
  because a *state-only* leaf module - a store, a plain-JS mixin, a util -
  imported it, which drags a component graph into a module graph that has to
  stay inert and deadlocked the form harness. Every consumer of the table kit is
  a Vue component or a slice-local helper whose import is type-only and
  therefore erased; that was checked by grep before the door was added, and it
  is the check to repeat whenever a kit considers a door.

The rule that survives, stated once for both:

- A kit may have an `index.ts` for its **public surface** - and only when the
  two facts just named hold: its consumers are components or type-only helpers,
  and it has internals worth keeping private. A kit without either keeps the
  module paths, for the reasons this amendment gave.
- A kit's door exports that surface and nothing else; the internals are reached
  by module path inside the kit, and nothing inside the kit imports its own
  door.
- A kit may still never depend on a domain feature, and it may not carry domain
  concepts. `dinero-helpers.ts` moving out of `shared/` into the contract slice
  is that rule being applied.

### Correction (2026-09-21): every folder has a door, kits included

The 2026-09-10 amendment and its 2026-09-11 correction are superseded on the
question they argued. The convention is now uniform:

- **Every folder under `src/features/` has an `index.ts`, and every folder under
  it does too** - Slice, kit, subfolder, nested subfolder. `forms/`, `shared/`
  and every subfolder gained the door the amendment had denied them.
- Anything **outside a folder** imports through that folder's door. The router
  and every other consumer outside a Slice uses `@/features/<slice>`; a sibling
  subfolder, the Slice's own door and the tests use the target subfolder's door.
- Inside a Slice, wiring to a file at the Slice root stays relative. The
  subfolder is *inside* that root, so it is not "outside" it, and routing it
  through the root door would only add a cycle. Cross-subfolder wiring goes
  through the target subfolder's door.

The one thing the prior sections got right is the hazard, and it is now the
single exception rather than a rule about kits: a **state-only leaf module**
importing a door that re-exports a component drags the component graph - and
bootstrap-vue-next with it - into a module graph that has to stay inert. That is
what deadlocked the form-harness specs. The exception is enforced in
`eslint.config.js`, not remembered: `no-restricted-imports` forbids every
`src/features/<slice>` door in `src/stores/`, `src/mixins/`, `src/services/`,
`src/models/` and `src/utils.js`, and those modules keep concrete imports.
`tests/unit/support/form-harness.js` is the same exception on the test side: it
is imported by a `bootstrap-vue-next` mock factory, so it imports
`@/features/auth/store` and never `@/features/auth`.

A door's contents stay deliberate: explicit named exports, and only what an
outsider might validly need. A subfolder's door is what a sibling, the parent
door or a test may reach for; a Slice's door is the outside surface, and the
parent reaches its subfolders through their doors rather than past them.

## Consequences

- A reviewer reads one directory per Slice instead of four disjoint trees.
- The public surface makes accidental reach-ins importable-only-by-review:
  crossing the boundary requires importing past an index that exists to say no.
- Two homes coexist during the rewrite (`src/views/` legacy,
  `src/features/` converted). That ends when the last Slice converts.
- The Module Part dropdown leak is gone structurally, not patched: vue-query
  keys per screen, and no singleton spans screens any more.
