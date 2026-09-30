import TheAppLayout from '../components/TheAppLayout.vue'
import SubNav from '../components/SubNav.vue'

// Route screens, split per chunk: the router holds a loader, not the module.
const InventoryStats = () => import('../features/inventory/stats/InventoryStats.vue')
const MaterialForm = () => import('../features/inventory/material/MaterialForm.vue')
const MaterialList = () => import('../features/inventory/material/MaterialList.vue')
const MaterialMoveForm = () => import('../features/inventory/mutation/MaterialMoveForm.vue')
const MaterialView = () => import('../features/inventory/material/MaterialView.vue')
const MutationForm = () => import('../features/inventory/mutation/MutationForm.vue')
const MutationList = () => import('../features/inventory/mutation/MutationList.vue')
const PurchaseOrderEntryForm = () => import('../features/inventory/entry/form/PurchaseOrderEntryForm.vue')
const PurchaseOrderEntryList = () => import('../features/inventory/entry/PurchaseOrderEntryList.vue')
const PurchaseOrderEntryView = () => import('../features/inventory/entry/PurchaseOrderEntryView.vue')
const PurchaseOrderForm = () => import('../features/inventory/purchase-order/form/PurchaseOrderForm.vue')
const PurchaseOrderList = () => import('../features/inventory/purchase-order/list/PurchaseOrderList.vue')
const PurchaseOrderView = () => import('../features/inventory/purchase-order/detail/PurchaseOrderView.vue')
const StatsTable = () => import('../features/inventory/stats/StatsTable.vue')
const StockLocationForm = () => import('../features/inventory/stock-location/StockLocationForm.vue')
const StockLocationList = () => import('../features/inventory/stock-location/StockLocationList.vue')
const StockLocationView = () => import('../features/inventory/stock-location/StockLocationView.vue')
const SupplierForm = () => import('../features/inventory/supplier/SupplierForm.vue')
const SupplierList = () => import('../features/inventory/supplier/SupplierList.vue')
const SupplierReservationForm = () => import('../features/inventory/reservation/SupplierReservationForm.vue')
const SupplierReservationList = () => import('../features/inventory/reservation/SupplierReservationList.vue')
const SupplierReservationView = () => import('../features/inventory/reservation/SupplierReservationView.vue')
const SupplierView = () => import('../features/inventory/supplier/SupplierView.vue')

export default [
  {
    path: '/inventory',
    component: TheAppLayout,
    // purchase order
    children: [
      {
        name: 'purchaseorder-list',
        path: '/inventory/purchaseorders',
        components: {
          'app-content': PurchaseOrderList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'purchaseorder-view',
        path: '/inventory/purchaseorders/view/:pk',
        components: {
          'app-content': PurchaseOrderView,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'purchaseorder-edit',
        path: '/inventory/purchaseorders/form/:pk',
        components: {
          'app-content': PurchaseOrderForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'purchaseorder-add',
        path: '/inventory/purchaseorders/form',
        components: {
          'app-content': PurchaseOrderForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'purchaseorder-add-from-reservation',
        path: '/inventory/purchaseorders/from/reservation/:reservation_pk',
        components: {
          'app-content': PurchaseOrderForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      // materials
      {
        name: 'material-list',
        path: '/inventory/materials',
        components: {
          'app-content': MaterialList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'material-view',
        path: '/inventory/materials/view/:pk',
        components: {
          'app-content': MaterialView,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'material-edit',
        path: '/inventory/materials/form/:pk',
        components: {
          'app-content': MaterialForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'material-add',
        path: '/inventory/materials/form',
        components: {
          'app-content': MaterialForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      // suppliers
      {
        name: 'supplier-list',
        path: '/inventory/suppliers',
        components: {
          'app-content': SupplierList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'supplier-view',
        path: '/inventory/suppliers/view/:pk',
        components: {
          'app-content': SupplierView,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'supplier-edit',
        path: '/inventory/suppliers/form/:pk',
        components: {
          'app-content': SupplierForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'supplier-add',
        path: '/inventory/suppliers/form',
        components: {
          'app-content': SupplierForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      // supplier reservations
      {
        name: 'supplier-reservation-list',
        path: '/inventory/supplier-reservations',
        components: {
          'app-content': SupplierReservationList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'supplier-reservation-view',
        path: '/inventory/supplier-reservations/view/:pk',
        components: {
          'app-content': SupplierReservationView,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'supplier-reservation-edit',
        path: '/inventory/supplier-reservations/form/:pk',
        components: {
          'app-content': SupplierReservationForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'supplier-reservation-add',
        path: '/inventory/supplier-reservations/form',
        components: {
          'app-content': SupplierReservationForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      // stock-locations
      {
        name: 'stock-location-list',
        path: '/inventory/stock-locations',
        components: {
          'app-content': StockLocationList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'stock-location-view',
        path: '/inventory/stock-locations/view/:pk',
        components: {
          'app-content': StockLocationView,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'stock-location-edit',
        path: '/inventory/stock-locations/form/:pk',
        components: {
          'app-content': StockLocationForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'stock-location-add',
        path: '/inventory/stock-locations/form',
        components: {
          'app-content': StockLocationForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      // mutations
      {
        name: 'mutation-list',
        path: '/inventory/mutations',
        components: {
          'app-content': MutationList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'mutation-add',
        path: '/inventory/mutations/form',
        components: {
          'app-content': MutationForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      // purchase order entries
      {
        name: 'purchaseorder-entry-list',
        path: '/inventory/purchaseorder-entries',
        components: {
          'app-content': PurchaseOrderEntryList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'purchaseorder-entry-view',
        path: '/inventory/purchaseorder-entries/view/:pk',
        components: {
          'app-content': PurchaseOrderEntryView,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'purchaseorder-entry-edit',
        path: '/inventory/purchaseorder-entries/form/:pk',
        components: {
          'app-content': PurchaseOrderEntryForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'purchaseorder-entry-add',
        path: '/inventory/purchaseorder-entries/form',
        components: {
          'app-content': PurchaseOrderEntryForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      // move material
      {
        name: 'material-move',
        path: '/inventory/move-material',
        components: {
          'app-content': MaterialMoveForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      // stats
      {
        name: 'inventory-stats',
        path: '/inventory/stats',
        components: {
          'app-content': InventoryStats,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },
      {
        name: 'inventory-stats-table',
        path: '/inventory/stats-table',
        components: {
          'app-content': StatsTable,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'inventory' }
        },
      },

    ]
  }]
