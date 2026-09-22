import TheAppLayout from '../components/TheAppLayout.vue'
import SubNav from '../components/SubNav.vue'

// Route screens, split per chunk: the router holds a loader, not the module.
const InventoryStats = () => import('../views/inventory/InventoryStats.vue')
const MaterialForm = () => import('../views/inventory/MaterialForm.vue')
const MaterialList = () => import('../views/inventory/MaterialList.vue')
const MaterialMoveForm = () => import('../views/inventory/MaterialMoveForm.vue')
const MaterialView = () => import('../views/inventory/MaterialView.vue')
const MutationForm = () => import('../views/inventory/MutationForm.vue')
const MutationList = () => import('../views/inventory/MutationList.vue')
const PurchaseOrderEntryForm = () => import('../views/inventory/PurchaseOrderEntryForm.vue')
const PurchaseOrderEntryList = () => import('../views/inventory/PurchaseOrderEntryList.vue')
const PurchaseOrderEntryView = () => import('../views/inventory/PurchaseOrderEntryView.vue')
const PurchaseOrderForm = () => import('../views/inventory/PurchaseOrderForm.vue')
const PurchaseOrderList = () => import('../views/inventory/PurchaseOrderList.vue')
const PurchaseOrderView = () => import('../views/inventory/PurchaseOrderView.vue')
const StatsTable = () => import('../views/inventory/StatsTable')
const StockLocationForm = () => import('../views/inventory/StockLocationForm.vue')
const StockLocationList = () => import('../views/inventory/StockLocationList.vue')
const StockLocationView = () => import('../views/inventory/StockLocationView.vue')
const SupplierForm = () => import('../views/inventory/SupplierForm.vue')
const SupplierList = () => import('../views/inventory/SupplierList.vue')
const SupplierReservationForm = () => import('../views/inventory/SupplierReservationForm.vue')
const SupplierReservationList = () => import('../views/inventory/SupplierReservationList.vue')
const SupplierReservationView = () => import('../views/inventory/SupplierReservationView.vue')
const SupplierView = () => import('../views/inventory/SupplierView.vue')

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
