# 6. The list kit: one engine composable and one screen-facing component

Date: 2026-09-11

## Status

Accepted. It carries out the consolidation the refactoring plan listed under
"Considered and deferred", which the user then asked for; that entry now points
here. It does not revisit ADR-0005 — see "Why ADR-0005 still stands".

## Context

By the end of the rewrite's table work, thirteen list screens ran on the kit in
`src/features/table/` — the four member lists, the two customer lists and the
seven user lists — and each of them repeated three things that were the same
everywhere:

1. **The `tableOptions` bridge.** `useServerPagedList` built the query, the
   sort, filter and page state and the wire query they compose, then handed
   them back as a `tableOptions` object for the screen to spread into
   `useAppTable({key, columns, ...paged.tableOptions})`. Every screen called
   two composables in a fixed order, then destructured six refs back out of the
   first one.
2. **The screen body, block by block.** Every `*List.vue` template repeated the
   delete modal, the page header and the panel, and forwarded eight props
   (`table`, `pagination`, `count`, `isLoading`, `isFetching`,
   `emptyText`, `label`, `rowClass`) by hand into the panel.
3. **`ListTablePanel.vue`, the wiring layer.** It owned the shared shell
   (`app-detail panel overflow-auto > data-table`), the `v-if="!isLoading"` rule
   on the pagination block, and the eight props it forwarded to `ServerDataTable`
   and `ServerTablePagination`. It was not an identity wrapper - it is the file
   `ServerTable.vue` now supersedes, and its spec's assertions moved into
   `server-table.spec.js` rather than being dropped. Calling it an identity
   wrapper is what made an earlier draft of this change merge the small
   components into one 357-line component; the review's phrasing was wrong and
   is recorded here so it is not repeated.

The kit's *small* components were not the problem, and the review that found
the accretion said so: `ListPageHeader` (48 lines), `ListDeleteModal` (58),
`ServerTablePagination` (81) and `ServerDataTable` (174) each own one thing
and are read on their own terms. What was wrong was the layer of wiring above
them — a bridge between two composables and a screen body assembled by hand
thirteen times.

## Decision

**One engine composable.** `useServerTable` is the whole engine: a screen passes
its `key`, its `columns` and its `listOptions`, plus the two list-level switches
`urlSync` and `loadError`, and gets back the table instance, `searchDraft`,
`pagination`, `globalFilter`, `isLoading`, `isFetching`, `count`, `refresh` and
`error`. The `tableOptions` bridge is gone, and `useAppTable` — the raw hook
result whose only job was to be spread into — is no longer exported.

**Where the engine lives (amended the same day).** The first landing put the
engine inside `table.ts`, which made that module hold the TanStack plumbing and
the whole reactive list engine at once — 289 lines with two reasons to change,
behind a name that describes only the first. It was split:

- `table.ts` (56 lines) — TanStack plumbing: `features`, `hook`,
  `createAppColumnHelper`, `AppFeatures`, `ColumnMeta`. It imports
  `@tanstack/vue-table` and nothing else.
- `server-paged-list.ts` (29 lines) — the wire contract of a server-paged list:
  `ServerPagedListQuery`, `baseListParams`, `PagedEnvelope`. Zero imports.
- `use-server-table.ts` (208 lines) — the engine: `ServerTableOptions`,
  `resolveUpdater`, `useServerTable`.
- `url-query-sync.ts` (101 lines) — the URL mirror both directions.
- `list-columns.ts` (58 lines) — the shared column helpers.
- `use-list-delete.ts` (55 lines) and `use-confirmed-action.ts` (86 lines) —
  the confirmed-action flow the delete modal and the API-user revoke share.
- `index.ts` — the kit's door, added once the split above made the surface
  worth naming. **Public**: `ServerTable`, `createAppColumnHelper`,
  `useServerTable`, `baseListParams`, `createActionColumn`,
  `useConfirmedAction`, and the `ListRow`, `AppFeatures`, `ColumnMeta`,
  `ServerTableOptions` and `ServerPagedListQuery` types. **Internals, reached
  by module path inside the kit and deliberately not exported**: `hook`,
  `useUrlQuerySync`, `useListDelete`, `PagedEnvelope`, and the
  `ListPageHeader` / `ListDeleteModal` components (zero consumers outside the
  kit). Nothing inside `src/features/table/` imports it.

The wire contract gets its own module because two callers need it and neither
should reach into the other's file: the engine, and `url-query-sync.ts`, which
mirrors exactly those four parameters into the address bar and can now import
them type-only from a module that imports nothing at all. A screen therefore
reads **one** import line, from the kit's door:

```ts
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'
```

That closed the gap the split had left open: after it, a screen still read three
module paths — `createAppColumnHelper` from `table`, `baseListParams` from
`server-paged-list`, `useServerTable` from `use-server-table` — each naming its
concern, and once `list-columns.ts` and `ServerTable.vue` were counted the
thirteen screens were importing five lines from four paths to name one concept.
The door names it once; the modules below keep their own exports, and the door
is additive. Why a kit may now have a door is ADR-0002's 2026-09-11 correction.

**One screen-facing component.** `ServerTable.vue` is what a list screen
renders: `<ListDeleteModal>` + `<ListPageHeader>` (with its `icon`,
`toolbar-extra` and `add` slots) + the
`app-detail panel overflow-auto > data-table` shell + `<ServerDataTable>` +
`<ServerTablePagination v-if="!isLoading">`, plus the `.page-details.panel`
box the layout uses. It carries the delete flow as one `deleteModal` prop
(id, confirm copy, destroy mutation, invalidation and its two toasts) and
exposes `showDeleteModal` for the icon column `createActionColumn` builds
before the component exists.

**It composes the kit; it does not absorb it.** The table's markup stays in
`ServerDataTable`, the pagination's in `ServerTablePagination`, the header's
in `ListPageHeader`, the confirmation's in `ListDeleteModal`. All four files
are unchanged by this ADR. `ListTablePanel.vue` is deleted, because its role
*is* the new component's: the shell plus the wiring between the table and its
pagination. `ServerTable.vue` is 158 lines, of which 53 are the template that
places those four children.

All thirteen screens were migrated to the two entry points, including the seven
user lists. The user-list column extraction (04e1bb31) landed first and
deliberately left the paged/`useAppTable` wiring to this change.

## Why ADR-0005 still stands

ADR-0005 rejected promoting a *collection factory*: a generic
`createModelCollection(axios, url)` that would rebuild transport, row identity
and cross-component reactivity for every resource, before any screen asked for
those capabilities. Its deciding argument was that generic-before-needed is the
horizontal instinct, and that the counter-precedent in this repository is
extraction *after* the second or fourth caller exists.

This change is the opposite question. It adds no capability to anything, serves
no resource that did not already use the kit, and invents no abstraction: it
deletes indirection inside a kit thirteen screens already adopt, and the two
entry points together do what the five files did between them. ADR-0005's rule —
no generic machinery before a caller needs it — is untouched; if anything this
removes a piece of generic machinery (a `tableOptions` channel that existed
only to be spread) rather than adding one.

## Alternatives considered

**Merge the whole kit into one component.** The first attempt at this change did
exactly that: `ServerTable.vue` contained the data table's markup and the
pagination's inline, and the two components were deleted. Rejected on
readability and on the kit's own precedent: the four pieces are 48, 58, 81 and
174 lines with distinct responsibilities, each with its own spec, and a screen
that needs to understand how a filter row is rendered should not have to read
the delete modal's prop documentation to find it. The screen-facing wrapper
exists to remove repetition at the call site, not to become the place where
every kit concern is read.

**Keep `ListTablePanel` as a thin wrapper over `ServerTable`.** Its only
possible implementation would make `ServerTable` render its header and modal
conditionally, so one component would carry two shapes — more indirection than
the file it replaced, plus a mode flag.

**Keep the bridge and delete only the panel.** Would leave the two-composable
call and the destructure at every screen, which is the part of the accretion a
screen pays for most often.

**Express the `.page-details.panel` box as a `v-if`/`v-else` pair.** The four
member lists render the table unboxed and the other nine inside the box; two
branches would duplicate the shell markup in one file. `ServerTable` renders
its two blocks inside a `:is`-selected wrapper (`div` or an element-less
passthrough component) instead, which keeps the markup written once and the
rendered DOM identical.

**Migrate the screens later.** Rejected for the same reason the plan gives for
extracting only with real callers: a kit that two APIs run through at once is a
kit nobody can read. Leaving the seven user lists behind would also have left
the branch unable to build, since the files they imported are deleted.

## Consequences

Behaviour is unchanged, and that was proven rather than assumed, per the
guide's extraction bar:

- the screens' specs ran **unchanged** — table kit 21, member 69, customer 145
  (5 skipped), user 326. Two kit specs that imported the deleted pieces were
  rewritten: `server-table.spec.js` replaces `list-table-panel.spec.js` (its
  assertions about the shell, the `v-if="!isLoading"` pagination and the row
  class moved into it, and it adds the exposed `showDeleteModal` handle), and
  `list-columns.spec.js` now builds its table with `useServerTable`;
- the rendered HTML was diffed against a pristine `HEAD` worktree across five
  mounts — customer rows, customer empty, customer page 2, module rows and a
  user list — and is **byte-identical**, with no normalisation at all. That is
  stronger evidence than the usual scoped-style caveat allows: because
  `ServerDataTable` and `ServerTablePagination` came back byte-for-byte and
  `ServerTable` carries no styles of its own, even Vue's `data-v-*` scope
  hashes match;
- the new spec pins the handle that crosses the seam — the screen's
  `tableRef.value?.showDeleteModal(id)` — because an unpinned imperative handle
  is the part of a restructure that breaks silently.

A screen's list wiring is now one `useServerTable` call and one
`<ServerTable>` with props and its `#add` slot, instead of two composables, a
spread, a six-ref destructure and three template blocks. The kit is
`ServerTable.vue` over four single-purpose components, plus the modules above
with one reason to change each: `table.ts` (plumbing), `server-paged-list.ts` (wire
contract), `use-server-table.ts` (engine), `url-query-sync.ts` (the URL mirror),
`list-columns.ts` (column helpers) and the confirmed-action pair
(`use-confirmed-action.ts`, `use-list-delete.ts`) — plus `index.ts`, the door that turns
those module paths into one import line for a screen.

**What this deliberately does not do.** No new table capability: no column
visibility, no row selection, no resizing, no server-side grouping, no second
pagination mode. Orders — the next Slice — is where a table requirement gets
decided, and it should decide it against real screens rather than against this
restructure. The kit still answers only to the Members, Customers and Users
lists it has today.
