We are progressively migrating this Vue application from an architecture organized by technical concern to one organized by feature.

When refactoring a slice of the application, the goal is not merely to move files. Leave the migrated code as a clean, well-factored part of the new architecture.

The target structure is roughly:

    src/features/
        member/
        customer/
        user/
        forms/
        table/
        ...

Domain features contain domain-specific functionality. Shared features such as `forms` and `table` contain genuinely reusable functionality. Let responsibilities determine the exact structure rather than forcing everything into predetermined folders.

Before modifying anything, understand the slice thoroughly: its routes, views, components, composables, data access, state, types, and dependencies. Also inspect existing features for established patterns and reusable abstractions.

ARCHITECTURE

Organize by feature rather than technical type.

Keep domain concepts inside the feature that owns them. Put genuinely shared concepts in an appropriate shared feature rather than a generic `utils`, `common`, or `shared` dumping ground.

Prefer dependency direction roughly like:

    shared functionality
          ↑
    domain features
          ↑
    application/pages/routes

Shared functionality should not unnecessarily depend on the domains that consume it.

COMPOSITION API + TYPESCRIPT

Convert Options API components to Composition API and JavaScript to TypeScript where applicable.

Do not mechanically translate the old implementation. Reconsider state ownership, derived state, watchers, lifecycle logic, and data flow as part of the migration.

Use TypeScript to express meaningful contracts and domain invariants, not merely to satisfy the compiler. Look for inaccurate types, unnecessary `any`, unsafe assertions, duplicated types, and APIs that expose implementation details.

COMPOSITION

Prefer focused components and composables with clear responsibilities.

Extract something when it represents a meaningful concept, has a useful contract, or is genuinely reusable. Do not extract code merely because it is long or superficially similar to something elsewhere.

Avoid abstractions for hypothetical future requirements.

DRY

Eliminate meaningful duplication of behaviour, knowledge, and responsibility.

Prefer a single source of truth for concepts that are genuinely shared. Put shared abstractions at the narrowest scope where they are actually reusable.

Do not eliminate superficial duplication at the cost of a worse abstraction. Some duplication is preferable to a bad abstraction.

EVOLVE SHARED FEATURES

Existing shared features are not immutable APIs.

If new functionality conceptually belongs in an existing shared feature such as `forms` or `table`, use that feature. If its current API is not powerful enough, improve the shared feature and then use the improved version.

Prefer:

    existing abstraction
          ↓
    new requirement exposes a limitation
          ↓
    improve abstraction
          ↓
    existing + new consumers use it

over creating a parallel feature-local implementation of essentially the same concept.

When extending a shared feature, keep its API coherent and preserve existing use cases. Do not add domain-specific concepts or one-off configuration merely to accommodate a single consumer.

If the abstraction is fundamentally the wrong concept for the new requirement, reconsider its design rather than forcing the use case into it.

The principle is: **when a legitimate new use case exposes a missing capability in a shared abstraction, improve the abstraction rather than working around it.**

ESTABLISHED LIBRARIES

Before implementing generic or infrastructure-like functionality, check whether an established library already solves the problem.

The project intentionally uses established libraries including:

- VueUse
- TanStack Query for Vue
- TanStack Table for Vue
- Valibot

In particular, check VueUse before writing utility functions or generic composables.

Likewise, prefer the project's established libraries for the problem domains they cover rather than creating competing implementations.

This reduces maintenance, benefits from battle-tested implementations, and gives the codebase a consistent vocabulary.

Do not force a library into a use case it does not fit. Domain-specific behaviour should remain domain-specific.

A useful general rule is: **before writing infrastructure, ask whether the ecosystem has already solved the problem well.**

REUSE HIERARCHY

When functionality resembles something that already exists, consider these options in order:

1. Use the existing shared abstraction or library.
2. Extend the existing shared abstraction if it conceptually fits but lacks a required capability.
3. Improve or rethink the abstraction if its current design is fundamentally inadequate.
4. Create a new abstraction when the concept is genuinely different.

Avoid competing abstractions for the same conceptual problem.

CORRECTNESS

Preserve existing behaviour unless there is a genuine bug or an intentional improvement.

Pay particular attention to:

- reactive dependencies
- lifecycle behaviour
- asynchronous operations
- loading, error, and empty states
- state ownership
- component and composable contracts
- API/data transformations
- form validation
- table behaviour
- effect/subscription cleanup
- TypeScript correctness

PROVING AN EXTRACTION CHANGED NOTHING

An extraction moves code without changing behaviour, and "the specs still pass"
is usually not proof: the specs that exist may not cover the markup, the focus
order, or the imperative handles that crossed the new seam. Three extractions in
this rewrite (the staged-equipment panel, the two Customer panels, the member
logo fields) converged on the same evidence, and it is the bar from here on:

1. Run the affected specs UNCHANGED. If a selector has to move because the DOM
   moved, say so in the commit and move only the selector.
2. Mount the component before and after, and diff the rendered HTML for the
   states that matter - create, edit, an invalid submit, a staged row, the modal
   open. Normalise generated element ids and teleported nodes. A real difference
   is a missing or changed element, class or copy; an ordering change inside a
   teleport is not one.
3. Pin the handles that cross the new seam with a spec of their own: the
   imperative calls the parent makes on the child (focus, show/hide, a method on
   an exposed ref). An unpinned handle is the part of an extraction that breaks
   silently, because nothing fails until someone uses it.

For a bug fix the bar is different and already established: a regression test
that fails before the change and passes after.

FLEXIBILITY

Design for likely future changes, not hypothetical ones.

Feature boundaries should allow domains to evolve independently where appropriate. Shared functionality should expose small, domain-agnostic interfaces.

Do not achieve flexibility through excessive configuration, generic abstractions, inheritance, or indirection. Flexibility is valuable when it makes real future changes easier.

READABILITY AND CONSISTENCY

Prefer straightforward code and explicit intent over cleverness and indirection.

Names should describe concepts and responsibilities. An engineer should be able to follow behaviour without traversing a maze of abstractions.

Follow established patterns in already-migrated features when they represent genuine architectural decisions. Before inventing a new pattern, look for how the codebase already solves similar problems.

Do not copy an existing pattern blindly if it is clearly inferior.

TRADE-OFFS

Do not optimize any single property in isolation.

The goal is not maximum DRYness, reuse, abstraction, type complexity, or minimum lines/files.

Optimize for code that is correct, understandable, maintainable, appropriately reusable, and easy to evolve.

In particular:

- less duplication is not always better
- more reuse is not always better
- smaller components are not always better
- more generic code is not always better
- more types are not always better
- fewer files are not always better

When two designs are both reasonable, prefer the simpler one.

PROCESS

1. Thoroughly inspect the target slice before modifying it.
2. Inspect existing features, shared abstractions, and established libraries.
3. Identify natural feature boundaries and dependency directions.
4. Migrate the code into the feature architecture.
5. Convert Options API to Composition API and JavaScript to TypeScript where applicable.
6. Improve responsibilities, duplication, state ownership, and abstractions where there is a clear benefit.
7. Reuse existing abstractions and libraries; extend shared abstractions when they conceptually fit but are insufficient.
8. Review the result for duplicated abstractions, accidental coupling, unnecessary indirection, and inconsistencies.
9. Run available type checking, linting, tests, and build checks and fix problems introduced by the migration.
10. Perform a final review as though you were adding a new feature to the codebase today.

SCOPE

Focus on the target slice and code directly relevant to it.

Changes elsewhere are appropriate when necessary to improve a shared feature, establish correct dependency direction, reuse an existing abstraction, or fix an issue exposed by the migration.

Do not perform unrelated cleanup or change code merely for stylistic preference.

COMPLETION

The migration is complete when:

- the entire target slice has been understood and migrated
- responsibilities and feature boundaries are appropriate
- Composition API and TypeScript are used appropriately
- existing abstractions and libraries have been considered
- shared abstractions have been extended where appropriate rather than bypassed
- meaningful duplication has been addressed
- no unnecessary abstractions have been introduced
- dependencies flow sensibly
- existing behaviour is preserved unless intentionally improved
- type checking, linting, tests, and builds pass
- the result naturally fits alongside the already-migrated features

At the end, summarize what you changed and why, important architectural decisions, shared abstractions you extended, libraries you used or deliberately did not use, anything you deliberately left unchanged, and any remaining concerns worth addressing later.