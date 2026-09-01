# 1. Vue Query as the fetching layer

Date: 2026-08-24

## Status

Accepted.

## Context

Every screen in this application fetches, caches, invalidates and re-fetches
server state, and until now each one answered those questions for itself: a
model method that stores a list on a component, a `loading` flag next to it, a
manual re-fetch after every save. The duplication is the rewrite's largest
single source of accidental code.

The API layer is generated from the backend's OpenAPI schema, and the generator
already emits Vue Query options for every endpoint (`src/api/@tanstack/`). Those
have never been usable: the composables they feed call `useQueryClient()`, which
throws unless the plugin is installed on the app. That one omission is why the
earlier conversion attempts stalled — each reached the point of needing a query
client, found none, and hand-rolled a substitute instead.

At the same time the manifest carried more than one answer to the question. A
reference implementation that appears to endorse three competing caching stacks
teaches the wrong thing regardless of which one the code actually uses.

## Decision

Vue Query (`@tanstack/vue-query`) is the fetching layer. It is installed
application-wide at startup, in `src/services/query-client.ts`, with defaults
chosen for a long-lived admin UI: a 30-second stale window, no refetch on window
focus, and no retry on a 4xx.

This ADR covers the installation only. No screen or model calls the query client
as part of the decision — the plugin lands against the existing application so
that any startup regression has exactly one candidate cause, and screens convert
afterwards, one Slice at a time.

## Alternatives considered

**Pinia Colada.** Genuinely on the table: smaller, Pinia-native, and this app
already runs Pinia. Rejected because the generator does not emit options for it
here — its generation was turned off — so choosing it means hand-writing per
endpoint exactly the layer that codegen otherwise gives for free. That is the
same trap the previous attempts fell into.

**TanStack DB.** A different shape of answer: a reactive client-side store with
queries over it, rather than a cache keyed by request. Attractive for the
list-heavy screens, but it is a data-model decision, not a fetching one, and it
sits on top of a fetching layer rather than replacing one. Explicitly out of
scope, and its packages are left in place — deciding about them is separate work
and this ADR does not pre-empt it.

**Keep hand-rolling.** The status quo: models fetch, components hold state. No
new dependency, and the team knows it. Rejected because it is the cost the
rewrite exists to remove, and because it produces a different cache-invalidation
bug on every screen.

## Consequences

- The generated query options become usable for the first time; converting a
  Slice no longer requires inventing a caching strategy.
- Retry and staleness are decided once, centrally, rather than per screen.
- Pinia Colada is not part of the stack, and should not be reintroduced without
  superseding this ADR.
- Two caching stories coexist during the rewrite — Vue Query in converted
  Slices, hand-rolled state in the rest. That is expected, and ends with the
  rewrite.
