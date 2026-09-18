# Equipment

Equipment, locations and buildings: the physical things a tenant maintains, and
where they stand.

    equipment/   EquipmentList, EquipmentDetail, EquipmentForm
    location/    LocationList, LocationDetail, LocationForm, EquipmentAtLocationTable
    building/    BuildingList, BuildingDetail, BuildingForm
    owner/       the customer-or-branch owner the three forms share: who chooses
                 (owner-kind), the picker and its reads (use-form-owner), the
                 block that renders it (OwnerPanel, OwnerSearch, OwnerDetails)
                 and the schema rule (owned-record-schemas)
    detail/      the pieces the three detail pages share
    documents/   the panel the forms and detail pages share
    invalidation.ts

Organised by entity, not by screen kind. Every feature in this repo that spans
more than one entity is - `customer/`, `member/`, `user/`, `statuscode/`. Only
`invoice/` is by screen kind, and that is the case where it is right: one entity
with five screen kinds. `owner/`, `detail/` and `documents/` are the
cross-cutting concerns, and they hold only what genuinely crosses entities.

The slice name follows the contract rather than the entities inside it: the
backend app is `apps/equipment`, the API prefix is `/api/equipment/*`, and the
tenant module key is `equipment` (with parts `equipment`, `locations`,
`buildings`).

## The three forms' owner

A member either has branches or it does not, and that decides which foreign key
an equipment, location or building hangs off. The API's create and update bodies
are a `oneOf` of the two shapes - `{branch, …}` or `{customer, …}` - because the
viewset picks its serializer from `member.has_branches` inside the method body,
where drf-spectacular cannot see it. The backend's own comment says a client
should "keep the pair and select per tenant at runtime"; `useOwnerContext` is
that selection.

It is always one of the two, including for the roles that do not choose. A
branch employee and a customer user are pinned to their own owner by the API,
which overwrites whatever the request carried - but the declared body still
requires the key, so the form sends it, read from `branch-my`/`customer-my`.
That is why `useFormOwner` keeps the *display* record and the *wire* id apart: a
pinned role sends an id nothing on screen accounts for.

The concern is one, so it lives once. A form hands `useFormOwner` its `record`
and `values` (typed `OwnedRecord`/`OwnedValues`, the two slots every owned
form holds) and gets back the picker's state, `ownerId` (the slot this
tenant's variant carries), `ownerLabel`, and `selectOwner`, which writes the
slot, fills the read-only block and focuses the name input. `OwnerPanel`
renders that result: the search row for whoever chooses, and the picked owner
below it, under ids the form prefixes (`building` gives
`building_branch_search` and `building_branch_name`). Its details block is a
slot, because the equipment form shows its owner in more places and under
other conditions than "chooses and has one". The rule the request schemas
cannot say - a chooser must pick an owner, a pinned role need not - and the
switch between the branch and customer create variants (or the patch body on
an edit) are `ownedRecordSchemas`, from which each entity's `schemas.ts`
exports its `validateX`/`parseX`.

The owner's three reads (the type-ahead, `branch-my`/`customer-my`, and the
named owner on an edit) are one query each, switching between the generated
`*Options` by tenant through `useQueryOf` (`features/forms`), not one query
per variant gated by `enabled`. The location form's building list is read the
same way.

The columns a list shows follow a different matrix from the one a form fills in.
A customer user and an employee both see no owner column, but a branch tenant's
employee still has its rows scoped by branch. Do not reuse one for the other.

## Where this slice departs from the legacy screens

| Screen | Change | Why |
| --- | --- | --- |
| all lists | Sorting rides `ordering`; the equipment list's owner columns are unsortable | `ordering`'s allow-list is name, brand, identifier, serialnumber, description, type, num_orders. `customer` and `branch` were sorted through the older `sort_field` contract, which took any column name. |
| location, building lists | Sorting is off, and no `ordering` is ever sent | Those endpoints declare no `ordering` parameter and their viewsets carry no ordering mixin, so the legacy sort headers were a silent no-op. Even a value restored from a shared address is not forwarded: the schema does not declare it. |
| location detail | Insights asks for the **location**'s stats | The legacy screen called the *equipment* stats helpers with a location id, so its charts showed whatever equipment happened to share that id. |
| location detail | The QR download is named `<name>.png` | `LocationSerializer` exposes no `uuid`, and the legacy name interpolated it - every location QR file was `<name> undefined.png`. |
| equipment, location forms | `replace_months` is sent as a number, and omitted when blank | The request schema declares an integer and a minimum of 0; the legacy text input sent the string it held. |
| equipment list | The add-state modal stays open when the save fails | The legacy modal closed on OK whatever happened, so a failed state add looked like a success. |
| equipment form | The second owner block gets its own id prefix | Both copies used the same ids (`equipment_branch_name` twice), so `label-for` and every `getElementById` resolved to whichever rendered first. |
| equipment form | The standard-hours input writes `standard_hours` | It was bound to `standard_hours_hour`, which is not an API field; DRF dropped it silently and the input did nothing. |
| equipment list | The QR export scopes to the type on screen | The button sits on a type-scoped list, so a spreadsheet covering both types answered a different question than the one on screen. |
| equipment form | No `price_dinero` in the body | `src/mixins/price.js` wrote a `price_dinero` object onto the model and it went out with every write. No API field exists for it. |
| equipment form | Dates are ISO strings again | Legacy bound the raw value to a picker whose `formats.input` is `dd/MM/yyyy` and wrote back whatever it held, so the wire value was not reliably an `isoDate`. The picked Date is now formatted from its **local** getters, not `toISOString()`, which reports the previous day for an evening pick east of UTC. |
| equipment form | `default_replace_months` is a number input | The generated entry is `v.optional(v.number())` and refuses the string a plain text input sent. Blank means the key is dropped, not sent as `''`. |
| equipment form | Panel 1's lifespan field has its own id | It was a second `equipment_default_replace_months`, the same duplicate-id defect as the owner block. The preserved id stays on the panel-2 field, the one every tenant sees. |
| equipment form | The type select is a hidden input on a branchless tenant | Legacy rendered a `BFormInput type="hidden"` there; `BFormInput` does not declare `hidden` in `InputType` and vue-tsc rejects it, so it is a plain `<input type="hidden">` with the same id and binding. |
| location form | Changing the owner clears the building | Legacy replaced the select's *options* but kept the selected *id*, so submitting after a change of owner wrote a building belonging to the previous owner. |
| location form | A pinned role is offered its owner's buildings | Legacy fetched none for a branch employee or a customer user, leaving a dead empty select. `BuildingViewset.list_for_select` ignores the parameter for a pinned role and filters by its own owner anyway. |
| all forms | The documents panel is told its resource | The panel resolves its endpoint once, at setup. It used to infer which from *which of its two props was present*, so a create form - which has no record yet - silently sent its uploads to the equipment endpoint, with a body that still validates. `kind` is now required. |

## Preserved defects

- **`LocationList`'s branch cell and `BuildingList`'s owner cells pass the row's
  own id** where the route resolves the related entity.
- **The equipment form's panel-2 Price group has
  `label-for="equipment_serialnumber"`** - a legacy copy-paste, so clicking the
  Price label focuses Serial number. Fixing it needs a new id, which is a DOM
  contract rather than a port decision.

## Route names: every name a screen emits is registered

The screens build some of their names from a `route_prefix` and the member's
shape, so a name can be emitted that no router ever defined. Five such names
existed, and **nothing failed**: `<router-link>` logs "No match" and the link
goes nowhere, and the frontend's typecheck cannot see it — the routers are `.js`
and `tsconfig` sets `checkJs: false`, so even an unimported constant in one
passes `vue-tsc` and only throws when the module is evaluated.

Fixed rather than preserved:

- `router/customer.js` now registers `customers-equipment-view-{type}` and
  `-edit-{type}`. A branch member's equipment list links each row to the typed
  name, and only the untyped pair was registered.
- `router/settings.js` now registers the untyped `settings-equipment-view` and
  `settings-equipment-edit`. The detail page picks its edit route by product
  family (plain on default, typed on shltr) and the location detail page's
  equipment table links to the plain view, so both were dead on a default tenant.
- `BuildingList` and `BuildingDetail` no longer branch to
  `customers-building-*`. Those screens have one mount, so they have one name
  family; the branch was reachable by any planning user of a member without
  branches and every link it produced was dead.
- The equipment QR export now scopes to the `type` on screen, as well as the
  search term. The button sits on a type-scoped list, so a spreadsheet covering
  both types answered a different question than the one on screen.

`tests/unit/router/equipment-route-names.spec.js` is what keeps this honest: it
imports all four routers (which evaluates them, so an unimported constant throws
there), collects every registered name, and asserts the set of names the screens
can emit is inside it.

## What is left of `src/models/equipment/`

The slice's own screens no longer touch it. `equipment.js` and `location.js`
were deleted with the company slice's `BranchView` migration, their last
caller. One file survives as a `TEMPORARY SHIM`, with a header naming its one
outside caller:

| File | Caller | Used for |
| --- | --- | --- |
| `Document.js` | `views/dashboard/dashboard_view/dashboardMixin.js` (dashboard Slice) | `setParentBranchId()`, `setType()`, `loadCollection()` |

`building.ts` and `EquipmentState.js` had no caller outside the Slice and were
deleted with the legacy views. Delete the surviving file when its caller
moves.

## Contract facts worth keeping

- `/api/equipment/equipment/` declares both sort contracts, the full column
  filter set, and `type` as an enum. `/api/equipment/location/` and
  `/building/` declare only `branch`, `customer`, `page`, `page_size` and `q`.
- The two QR exports are `BaseListView`, i.e. `IsAdminUser`. There is no staff
  fixture in the backend suite, so a test reaches them by creating a
  `User(is_staff=True)` inside `tenant_context`.
- `/api/order/orderline/latest_workorders/` applies `equipment`, `location` and
  `building`; all three are declared, which matters because valibot is generated
  from the schema and strips what it does not describe. Before that they were
  stripped, so the shltr workorders card silently listed the whole tenant's.
- A document's **request** `file` is base64; its **response** `file` is an
  absolute URL. The panel keys "already on the server" on that difference.

## The order Slice's components, mounted un-rewritten

`OrdersTable`, `OrderStats`, `WorkOrdersTable` and `OrderTypesPie` belong to the
order Slice and are used here as they are. They import the legacy order models,
which is the same cross-slice import the customer Slice documents and accepts -
see `features/customer/README.md`. Their own migration belongs to their own
slice; a spec for a detail page stubs them, so their mount-time reads do not
drag the order endpoints into an equipment test.

## Test notes

The strict API seam rejects any request or response the generated schema does not
describe, so a fixture must be built from the generated component
(`fixtureFor(vX, {...})`) and a responder registered for every endpoint a screen
touches.

Three traps cost real time here and are worth knowing before writing a spec:

- `customer_branch_view` is a `v.union([vCustomer, vBranch])`. A hand-written
  `{id, name, city}` is neither member and the seam rejects the stubbed
  response; build a complete member with `fixtureFor(vCustomer, {...})`.
- `ServerDataTable` puts the click handler on the `<th>`, and a sortable header
  carries `aria-label="Sort by <columnId>"`. There is no inner button.
- Each stats endpoint wraps its payload in a key named after itself, and the
  generated response schema already carries that wrapper - so the responder is
  `fixtureFor(vOrderTypesStatsResponse)`, not a hand-built `{[key]: …}`.
- **The datepicker stub must be keyed `VueDatePickerRoot`.** `@vuepic/vue-datepicker`
  exports an unnamed wrapper whose *inner* component is also called
  `VueDatePicker`; a stub keyed `VueDatePicker` replaces the inner one and
  receives no props at all, so the spec passes while measuring nothing.
- A stub does not inherit the real component's prop defaults. Where a spec
  asserts on a prop the component gives a default, assert the value the *parent*
  passed, or the assertion pins the stub rather than the contract.
- `src/router/*.js` is **not type-checked** (`allowJs: true`, `checkJs: false`),
  so a router can reference a constant it never imported and pass typecheck,
  lint and the whole suite. `equipment-route-names.spec.js` imports the routers
  precisely so that failure mode has somewhere to surface.
