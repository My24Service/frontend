# Context

The domain language of the My24Service frontend. A glossary, not a spec — no
implementation details here.

## Member

A tenant company: one customer organisation that uses My24Service. Has a
`companycode`, which is also its subdomain.

Administering Members — creating, editing, deleting, approving requested ones —
is something only My24Service **staff** do, across all tenants at once. A
Member's own users never see another Member.

Not to be confused with **Tenant Profile**, which is one Member seen from the
inside.

## Tenant Profile

The currently signed-in Member's own record, as the rest of the application
reads it: company name, logo, VAT types, and the long tail of per-tenant
settings that change how orders, invoices and equipment behave.

It describes the same underlying Member, but it is a different concept because
it answers a different question. **Member** answers "which companies exist";
**Tenant Profile** answers "what is true about *us*". They have different
audiences (staff vs. every user), different lifecycles (edited rarely by staff
vs. read constantly by everything), and different scopes (all tenants vs. one).

The codebase currently calls this `memberInfo`, which is why the two get
confused.

## Slice

The unit of the frontend rewrite: one view directory, the model directory it
owns, and every route that mounts those views.

Deliberately not "a directory" and not "a section of the UI", because those
disagree. A Slice can be mounted at several routes (Member is mounted at three
list routes), and one view directory can be mounted from more than one router
tree.

## Shim

A deliberate, temporary adapter that lets not-yet-rewritten code keep working
against a rewritten Slice.

A Shim is defined by where it lives: **outside** the Slice, in the legacy
caller. Code inside a finished Slice contains no Shims — that is what makes the
Slice an example worth copying. During the rewrite a Shim may sit inside the
Slice temporarily, but it does not survive to the end.
