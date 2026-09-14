# The Statuscode Slice

Three screens, mounted once per code type and twice per tree: the statuscode
list for a type, the statuscode create/edit form, and the action create/edit
form — what a statuscode *does* when an order, quotation, invoice, leave
request, sick leave or work-hours record reaches it. This directory follows
the Member Slice (`src/features/member/`, the reference implementation):
the same rules, the same testing bar. Read this file for what the Statuscode
Slice adds on top.

## What it replaced

The slice was scattered over three model directories, because the backend
prefix (`/company/`, `/invoice/`, `/quotation/`) had decided where each file
lived: `models/company/Abstract{Statuscode,Action}.js`, seven
`<Type>Statuscode.js` / `<Type>Action.js` pairs under `company/`, `invoices/`
and `quotations/`, and the five views in `views/company/statuscode/`. All
fourteen concrete models were the same fifteen lines with a different
`code_type` string; the only two endpoints, `/api/statuscode/statuscode/` and
`/api/statuscode/action/`, are fully covered by the generated client.

## Layout

```
index.ts                the one door; the router mounts what is exported here
code-types.ts           the six code types this Slice edits, their labels, and
                        the route names each tree gives them
invalidation.ts         the one invalidation both writes share
StatuscodeList.vue      the list, on the shared server-paged table kit
StatuscodePills.vue     the type pills above the list
StatuscodeLabel.vue     a statuscode drawn in its own colours (list preview
                        and form preview)
statuscode/             the statuscode form, its expiry-condition fields and
                        its schemas
action/                 the action form and its schemas
```

## What this Slice adds to the reference pattern

### One screen per type, typed by a prop

The legacy screens took a `list_type` string and switched on it in
`created()` to pick one of six service classes. The converted screens take
`codeType: CodeType` — a union the router builds its routes from
(`CODE_TYPES.flatMap(createStatuscodeRoutes)`) — and pass it to the wire
(`code_type=` on the list query, stamped on the body at parse time). There is
no per-type class left; the type is data.

The wire enum (`vCodeTypeEnum`) also carries `trip` and `purchase_order`.
Those are not in `CODE_TYPES`: the trip statuscodes have their own endpoint
and screens under `/api/mobile/`, and the purchase-order status is the
Inventory Slice's.

### Two trees, one place that knows both

Both routers mount the three screens — `/company/statuscodes/<type>` and
`/settings/statuscodes/<type>` — and each tree has its own route-name scheme.
`routeNamesFor(type, fromSettings)` in `code-types.ts` is the only place that
knows both; the screens read their five names from it. The legacy screens
rebuilt the strings in three separate `getNavLink` methods, and the pills'
copy dropped its argument, so every pill in the company tree pointed at the
order list. The pills now link each type to its own list, in both trees.

### The pills live in the table kit's `subnav` slot

The list kit's page header had no place for a row of tabs between the title
bar and the table — the pills' first landing, in the toolbar, wrapped into
the search box. `ServerTable` now has a `subnav` slot for exactly that: the
tabs or pills a screen uses to switch between kinds of the same list. Added
to the kit rather than worked around, per the refactoring guide.

### A palette instead of two colour pickers

The legacy form let a user pick a background *and* a text colour freely,
which allowed unreadable labels. The converted form offers a fixed palette
for the background (`statuscode/palette.ts`, `LabelColorField.vue`) and
derives the text colour from it — `labelTextColor()`: the same hue, pushed
to `L≈22` on a light background or `L≈97` on a dark one, whichever contrasts
better — so `text_color` still rides the wire (dispatch reads it off the
record as before) but is never chosen by hand.

The palette is the golden-angle hue walk `OrderTypesPie` uses, at one OKLCH
lightness and chroma per series (`L 78 / C 14` light, `L 45 / C 14` dark).
The light series takes hues until a new one would land within 18° of an
existing one; the dark series then *continues the same walk*, so its hues
fall between the light ones rather than repeating them. Both are sorted by
hue for display. That gives 13 + 13 swatches. Colour maths goes through the
`color` package (already a dependency): OKLCH → hex, and WCAG contrast for
the text choice; `palette.spec.js` pins ≥ 4.5:1 for every swatch.

A record whose colour predates the palette keeps it: the field shows that
colour as a third, selected swatch until another is picked, and a save
re-derives its text colour. `StatuscodeLabel` falls back to the derived
text colour when a record carries none.

`vue3-colorpicker` is no longer imported anywhere; it stays in
`package.json` until you decide to drop it.

### The action "add" route has its own path

`action/<type>/form/:statuscode_pk` (add) and `action/<type>/form/:pk` (edit)
were the same path pattern, so a reload of one resolved as the other —
whichever was registered first — and an "add" URL opened an edit of the
wrong record. The add route is now `action/<type>/add/:statuscode_pk`. Route
*names* are unchanged.

### The expiry condition is a quotation concept

`num_days`, `num_days_operator` and `num_days_model_field` say when a
quotation expires ("14 days after `sent`"). The legacy form showed the three
fields for every type and sent them for every type; the converted form
renders `ExpiryConditionFields` for `quotation` only, and `parseStatuscode`
leaves the three keys off the body for every other type. The fields bind
straight to the form's values — the legacy child kept its own copy and
emitted it on every keystroke.

### Blank optional text goes out as null

The legacy statuscode form deleted a blank `description` /
`new_status_template` from the body before sending, which on an edit meant a
field could never be cleared — the key was simply absent from the PATCH.
Both forms now send a blank optional text as `null` (the generated entries
are `nullish`, `minLength(1)` when present), so clearing a field saves.

### What the action form gates

An order may trigger the full set of action types; every other type may
notify (email, SMS, FCM) and nothing else — `actionTypesFor` in
`action/schemas.ts`. "Send to Gripp" is offered on an order only when the
tenant's contract carries `company:connector-gripp` (or the user is a
superuser), through `my24.hasAccessToModule` — the legacy list carried the
option unconditionally *and* pushed it a second time when the check passed.
The partner picker for the copy action loads through the generated
`companyPartnerList` query, order type only.

A condition is staged only when its three parts are filled:
`vActionConditionRequest` requires each part non-blank, so a half-typed
condition used to be staged and then fail the save.

### The Shims

`src/models/quotations/QuotationStatuscode.js` and
`src/models/invoices/InvoiceStatuscode.js` stay, each a one-method Shim over
the generated client, because the not-yet-rewritten `QuotationList` and
`InvoiceList` still read their type's statuscodes through them (for
`TableStatusInfo`, which takes the service as a prop and never calls it). They
go with the Quotation and Invoice Slices.

## Ledger

The colour rule — the form requires a `color` the API leaves nullable — is
entry 12 in `docs/schema-strengthenings.md`.

## Tests

`tests/unit/features/statuscode/`: the list (wire contract, rows and nested
actions, pills, both trees, search, delete), the statuscode form (create,
edit, the refusals, the null-for-blank, the expiry condition per type, the
invoice type the legacy form threw on), the action form (create with the
statuscode from the route, the per-type lists, the Gripp gate, the partner
load, the condition table, delete), and both schema modules.
`tests/unit/support/statuscode-routes.js` carries both trees' routes for the
harness.
