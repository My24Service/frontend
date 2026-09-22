# Shared detail chrome

The pieces a detail page for "a thing that has orders at it" is built from.
Equipment, locations, buildings (`features/equipment/`) and branches
(`features/company/branch/`) all use it; nothing here knows which of them
it is rendering beyond the `DetailOwnerKind` the orders query is keyed on.

    DetailLayoutSidebar.vue / DetailLayoutCards.vue   the two product-family layouts
    detail-fields.ts                                   the field rows the layouts render
    use-detail-chrome.ts                               the order-search modal, refresh-all and go-back
    use-detail-orders.ts                               the orders-at-this-record block
    QrPanel.vue / use-qr-code.ts                       the QR download panel

It moved here from `features/equipment/detail/` once a second feature needed
it. A new detail page that shows orders at a record starts from these rather
than copying them into its own feature.
