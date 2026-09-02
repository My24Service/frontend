# The Customer Slice

Six screens in two groups — the customer list, the customer form (create/
edit, with its documents panel and branch-partner section) and the customer
detail view, which doubles as the customer-type user's dashboard; plus the
maintenance-contract list, its create/edit form (whose equipment rows are
staged client-side and replayed on save) and its detail view, whose orders
tab hands equipment lines to the maintenance order form — rewritten end to
end as the second Slice of the rewrite. This directory follows the Member Slice
(`src/features/member/`, the reference implementation): the same rules, the
same testing bar, the same shape of ADRs. They are not restated here; read
this file for what the Customer Slice adds on top and where it had to
differ from the legacy behaviour.

## Layout

```
index.ts              the one door; the router mounts what is exported here
customer/             the three screens, their schemas and their invalidation
document/             the documents panel, its schemas and its invalidation
maintenance-contract/ the contract list, form and view, with the staged
                      equipment rows and their invalidation helpers
session-auth-header.ts  the Authorization story every write/retrieve needs
```

Both list screens run on the shared server-paged TanStack Table kit in
`src/features/table/` (promoted out of the Member Slice when the Customer
list became the kit's second consumer). The kit replaced this Slice's own
`paged-list-screen.ts`, `route-paged-list.ts` and `ListPagination.vue`, which
are gone with the b-table screens they served.

The list's column filters ride the wire under the shared bare-name
grammar (no `__icontains` suffixes — the backend's filter kind decides the
lookup, see my24service `apps/core/filters.py`): `name`, `city` and
`remarks` narrow case-insensitively, `num_orders` takes an exact value or an
`18...80` (inclusive) / `18..80` (exclusive) range. Sorting rides the wire as
the engine's `ordering` list — the backend's OrderingMixin (the viewset also
carries the legacy `sort_field`/`sort_dir` mixin; `ordering` wins if a
request ever carried both), closing ledger #1. With `urlSync` the wire query mirrors into the URL
bar (`useUrlSearchParams('hash')`), so a narrowed view survives a reload and
can be shared as a link — defaults are omitted, a shared address restores the
view before the first request, and the browser's back/forward applies the
address to the state.

`src/models/customer/Document.js`, `MaintenanceContract.js` and
`MaintenanceEquipment.js` are deleted — the contract screens were their only
consumers, and the panel and the contract screens read the generated queries
directly. `src/models/customer/Customer.js` is now the Shim beside its
legacy callers (quotation, order, invoice, equipment and company screens); it
keeps `CustomerModel`, `CustomerPriceModel`, the autocomplete `search` and
`getMyCustomer`, and dies when those screens get their own Slices.

The equipment/location/building screens the customer router also mounts are
NOT in this Slice: they are shared components (`src/views/equipment/`, their
own `SubNavEquipment` and models), mounted identically by `router/equipment.js`
and `router/settings.js` — they are the Equipment Slice's to move. The
`MaintenanceEquipment` resource (a contract's tariffed equipment rows) is
customer-domain — `/api/customer/maintenance-equipment/` — and is the
contract form's staged collection here.

## What this Slice adds to the reference pattern

### The Authorization header

The customer viewset's schema documents the API-user JWT as a REQUIRED
`Authorization` header on its create/retrieve/update/destroy operations
(`schema_utils.AUTH_TOKEN_PARAMETER` — documentation for the mobile API users
that share the viewset). The generated client's request validator refuses to
send anything without it. The web app authenticates by session cookie, so
every call site of those operations passes `SESSION_AUTH_HEADER`

<!-- trimmed for diet — see docs/manual-checklists.md -->
**Maintenance contract form** — `/customers/maintenance-contracts/form[/:pk]`
- [ ] Create: empty submit shows the name and customer messages; the customer
      autocomplete searches (debounced), selecting one shows the card and
      opens the equipment panel
- [ ] Equipment rows: the autocomplete filters to the customer; a staged row
      shows in the table; edit and delete work; the running contract value
      shows (a repaired display, see the ledger); quick-create from the
      no-result panel lands in the staged row (repaired, see the ledger)
- [ ] Save: the contract posts, the staged rows replay after it, the toasts
      fire, and the form navigates back; edit loads the contract, the
      customer and the equipment

**Maintenance contract view** — `/customers/maintenance-contracts/view/:pk`
- [ ] The contract value and remarks render; the customer card links to the
      customer detail
- [ ] Equipment tab: rows render frequency and tariff; Select equipment
      stages order lines; checking one enables Add equipment, which stores
      the selection and routes to the maintenance order form
- [ ] Orders tab: the contract's orders render, paginate at twenty, and a
