# 5. The collection-factory prototype was not promoted

Date: 2026-08-26

## Status

Rejected (for the rewrite's architecture). The prototype itself is preserved,
unmerged, on the archive branch `archive/horizontal-migration-poc` (see
ADR-0004 for what that branch holds).

## Context

Alongside the horizontal migration, a parallel track asked what would replace
`BaseModel` when it died. Its final state lives in
`src/models/orders/poc/` on the archive branch — `CostCollection.poc.ts`,
`cost-schemas.ts`, `createModelCollection.ts`, `useOrdersQuery.ts`, with live
demos in `OrdersTablePoc.vue` and `CostCollectionTablePoc.vue` — and evolved
through its committed iterations:

1. **v3bb13616** — a TanStack DB collection wrapping a live `CostService`;
   BaseModel still underneath.
2. **v4ae38282** — BaseModel dropped for a `createModelCollection(axios, url)`
   factory that reimplemented CSRF/header handling as functions, demoed in a
   reactive vue-table.
3. **v4ea47996** — schemas attached to the collection, all derived from the
   generated valibot components (`vCost` / `vCostWritable` / `vPatchedCost`):
   read/insert/patch trio plus a `toWritePayload` hook, DRF decimal strings
   folded into Dinero values under `${field}_dinero`, computed display fields
   lifted into the schema so column definitions stay dumb.
4. **v59883772 / v3b4410b9** — the factory generalised to optional schemas,
   and `useListQuery` splitting query-plus-pagination state out of BaseModel
   so five list views (ImportList, UserApiList, PartnerRequestsReceivedList,
   LeaveRequestsList, UnconfirmedSickLeaveList) could drop it entirely.

The prototype solved real problems well. Typed list filters straight off the
generated operation; three schemas instead of one lying one; row identity and
live cross-component reactivity via TanStack DB; a form-defaults derivation
that could not drift from the wire shape.

## Decision

Do **not** promote the factory. The rewrite proceeds per Slice with the
generated query options and mutations called directly (ADR-0002), and each
Slice extracts its own composables when a second caller appears.

The deciding observation is recorded in the prototype's own header comment:
by v4, what remained of the factory once the generated SDK and its TanStack
Query wrappers did the transport was only Cost's actual model definition.
That collapse *is* the Slice pattern — there is nothing left to promote
except the parts no screen has asked for yet.

## Reasons, stated

**Its surviving delta solved a problem nobody has.** After the collapse, what
remained was the TanStack DB row-store: identity by key, live reactivity
between unrelated components reading the same rows. No Slice screen reads
another screen's cache entries through anything but the URL-carried query key
(#324), and none needs two tables updating from one mutation beyond what
query invalidation already does. Adopting `@tanstack/db`,
`@tanstack/query-db-collection`, `@tanstack/vue-db` and `@tanstack/vue-table` — three runtime
dependencies present only on the archive branch — would buy capabilities
before any ticket required them.

**Generic-before-needed is the horizontal instinct again** (ADR-0004). One
abstraction serving every future resource sounds like leverage; in this
repository's history it was months of foundation with zero screens retired.
The counter-precedent already exists inside the finished Slice: the list
scaffolding was extracted only when the fourth screen was about to copy it
(#324), and `route-paged-list.ts` exists because two callers existed, not
because four were imagined.

**The per-resource remainder refused to stay generic.** Dinero transforms,
display strings, computed cells — the PoC carried these as Cost-specific
hooks bolted onto a generic shell. That is BaseModel's shape again: a common
spine plus an ever-growing bag of per-resource special cases. The Slice keeps
them as plain code next to the screens that use them (`module-paths.ts`,
`schemas.ts`), which is where they are allowed to stay small.

## What survives

The prototype's ideas were not wasted; most of them landed independently once
a concrete caller appeared:

- schema-derived form defaults → `formDefaults` in `src/models/schema.ts`,
  now feeding both legacy models and #326's Member Shim;
- read/insert/patch as three honest shapes → the per-screen `schemas.ts`
  pattern built directly on the generated bodies (ADR-0003);
- typed filters from operations → every Slice query keyed reactively off
  route parameters the generated operation declares;
- direct generated wrappers, no service class → the entire Slice;
- `useListQuery`'s separation of fetch state from pagination state →
  `route-paged-list.ts` + `ListPagination.vue`.

A future reader who finds `createModelCollection` in history should read it
as the sketch that proved the generated layer was enough, not as unfinished
work waiting to be resumed.
