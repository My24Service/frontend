# Column filters

The filter bar a list screen gets above its table: a **Filter** menu of the
columns that can be narrowed, one **chip** per filter in force (`Company:
acme ×`), and *Clear all*. Clicking a chip opens its editor in a popover;
the editor applies as it goes, so closing is only ever dismissal. The bar
renders nothing on a screen whose columns declare no filter.

The state is the table's own `columnFilters` — `useServerTable` commits it
on a debounce, sends it on the wire under the bare column name, and mirrors
it into the address bar — so a shared URL restores the chips.

## Declaring a filter

A column takes one `meta.filter`, whose `variant` picks the editor:

```ts
columnHelper.accessor('order_name', {
  header: $trans('company'),
  meta: {filter: {variant: 'text', label: $trans('Company')}},
})
columnHelper.accessor('num_orders', {meta: {filter: {variant: 'number'}}})
columnHelper.accessor('start_date', {meta: {filter: {variant: 'date'}}})
columnHelper.accessor('order_type', {
  meta: {filter: {variant: 'select', options: orderTypes.map((value) => ({value, label: value}))}},
})
// A column that shows a name but is really a foreign key: filters under
// its own `param`, lists through an autocomplete (the whole list when it
// is short, narrowed by the typed term when it is not), and names a
// restored id through `resolveLabels`.
columnHelper.accessor('order_name', {
  meta: {filter: {
    variant: 'select',
    label: $trans('Customer'),
    param: 'customer_relation',
    loadOptions: (term) => queryClient.fetchQuery(customerCustomerAutocompleteListOptions({query: {q: term}})).then(asOptions),
    resolveLabels: (ids) => queryClient.fetchQuery(customerCustomerAutocompleteListOptions({query: {id: ids.join(',')}})).then(asOptions),
  }},
})
```

`label` names the chip and the menu entry; it defaults to the column header
when that is a string. The full contract is `ColumnFilterSpec` in
`../table.ts`.

| variant  | editor                                                          | wire value (`apps/core/filters.py`)                      |
| -------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| `text`   | one box                                                         | `acme` — case-insensitive substring                      |
| `number` | Exactly / At least / At most / Between (+ exclude endpoints)    | `25`, `18...`, `...80`, `18...80`, `18..80`              |
| `date`   | Day / Month / Year / From / Until / Between, an inline calendar | `2026-09-15`, `2026-09`, `2026`, `2026-09-01...`, ranges |
| `select` | a list of any-of picks, searchable past 8 options or with `loadOptions` | `a,b` — the picked values, a comma inside one written `\,` (`ArrayFilter`) |

A select is always any-of several picks, so its backend column must be an
`ArrayFilter` — `in` for whole values (an order type, a foreign key),
`icontains` where each pick is a prefix (a statuscode against the status
text). A `TextFilter` would substring-match the joined list and find nothing.

`filter-grammar.ts` is the pure half: it parses those wire spellings into
values the editors bind to and describes them in the chip's words
(`18 – 80`, `≥ 18`, `09/2026`, `from 01/09/2026`, `Acme, Beta`).

## Driving it from a spec

`tests/unit/support/column-filters.js` — `addFilter`, `chip`, `chipTexts`,
`editorInput`, `pickMode`, `closeEditor`. Mount with
`stubs: {transition: false}`: the popover's open and close ride the real
`<Transition>`, and the default stub never fires its hooks. See
`tests/unit/features/table/column-filter-bar.spec.js`.
