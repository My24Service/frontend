# Manual browser checklists

The network seam cannot see a control in the wrong place, a missing label or a
broken layout. Walk the relevant list against a development tenant with a
staff login (a customer-type login where noted) after any cross-cutting
change — and once per new Slice, as its own version of this list. Checked
means done on ______ (date) by ______.

## Member Slice (`src/features/member/`)

**Module Parts** — `/members/module-parts`
- [ ] List renders name/module/always-selected columns; row edit icons land on the right records
- [ ] Add form opens empty with the module dropdown populated; submit returns to the list showing the new part
- [ ] Edit opens pre-filled; toggling always-selected survives a save
- [ ] Delete confirms, removes the row, toasts success

**Modules** — `/members/modules`
- [ ] List renders; add/edit/delete round-trip like Module Parts
- [ ] Deleting a module that owns parts behaves sanely (backend cascade visible without frontend crash)

**Contracts** — `/members/contracts`
- [ ] List shows name + modules_text columns
- [ ] Form renders the module tree grouped by module with always-selected parts pre-ticked and disabled
- [ ] Ticking parts encodes `module_paths_pks`; save round-trips losslessly (reopen and compare ticks)
- [ ] Delete stops offering the contract in the Member form dropdown afterwards

**Member list** — `/members/members`, `/members/deleted-members`, `/members/requested-members`
- [ ] All three URLs open the same component in their variant; labels ("Member"/"Deleted member"/"Requested member") follow the variant
- [ ] Rows link to the right edit pages; logos render in the first column
- [ ] Pagination works when the tenant has >20 rows; the search input searches and keeps the term across a page change (URL carries `?page=&q=`)
- [ ] Delete asks, deletes, re-fetches the page you were on
- [ ] Superuser-only controls appear per the characterised asymmetry: Add member on the active list, and the Requested/Deleted selects on the form when editing a member that already is one

**Member form** — `/members/members/form` and `/members/members/form/:pk`
- [ ] Create validates: empty submit shows field-level messages; company logo required on create only
- [ ] Typing a company code goes green/red half a second after you stop typing; taken codes block submit with the message
- [ ] Choosing a logo shows the preview beside "Current image"; editing shows the stored logos
- [ ] Save shows the overlay and disables both buttons; double-click sends one request; failure toasts the API's reason and keeps your typing
- [ ] Success returns to the list already showing the change (no manual refresh)
- [ ] Cancel leaves without saving; header Save and footer Submit behave identically
- [ ] Request flow (the staff route to `/members/members/form`, "Request new member") fixes the request flags and toasts "Request has been created"

**Cross-cutting**
- [ ] No console errors on any screen
- [ ] SubNavMembers badge count updates after approving/rejecting requested members

## Customer Slice (`src/features/customer/`)

**Customer list** — `/customers/customers`
- [ ] Rows render name/contact/orders/remarks; branch rows show the branch
      address block and the pink `branch` background
- [ ] Sorting arrows toggle and the URL carries the `ordering` list
      (rows reorder server-side — the OrderingMixin contract)
- [ ] The search input searches, and the URL carries `?q=`; pagination
      works with more than 20 rows
- [ ] Column filters narrow server-side: name/city/remarks as substrings,
      `num_orders` as an exact value or a `18...80`/`18..80` range
- [ ] Delete asks, deletes, toasts success, and reloads the page you were on
- [ ] Download asks, and the Excel file honours the search term
- [ ] Add customer links to the form

**Customer form** — `/customers/customers/form` and `/customers/customers/form/:pk`
- [ ] Create: empty submit shows the six field messages; a tenant with
      auto-generated ids shows a readonly prefilled id, others can type one;
      "generate new" fills the latest id
- [ ] Edit: the record fills every field; prices show the stored currency;
      saving returns to the list already showing the change
- [ ] Documents panel (edit only): empty collection auto-opens the add form;
      choosing files stages rows; edit/delete stage; Save changes POSTs,
      PATCHes and DELETEs in that order; a stored file is never re-uploaded;
      Discard rolls everything back
- [ ] Branch section: the dropdown lists only partners with branches;
      choosing one fetches its branches; Synchronize orders copies and
      refetches; Create-from-customer asks, creates and selects the branch;
      the address fields disable while "use branch address" applies

**Customer detail / dashboard** — `/customers/customers/:pk` and `/customers/dashboard`
- [ ] Staff: the title shows the record, Edit customer links to the form, and
      the five tabs render orders, equipment, contracts, locations and the
      Insights statistics (stats fire on first open)
- [ ] Orders paginate at twenty
- [ ] Customer-type user at `/customers/dashboard`: an empty shell renders
      without errors, no record fetch, no crash (see the ledger)

**Maintenance contracts list** — `/customers/maintenance-contracts`
- [ ] Rows render name (link to the view), customer, the formatted contract
      value, remarks and created; edit and delete icons per row
- [ ] Sorting arrows toggle (server-side via the `ordering` list); the
      search input searches, and the URL carries `?q=`; pagination moves
      through the URL
- [ ] Delete asks, deletes, toasts success, and reloads the page you were on
- [ ] Add contract links to the form

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
      page change refetches only the orders
