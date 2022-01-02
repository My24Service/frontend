import TheAppLayout from '@/components/TheAppLayout'
import SubNavInventory from '@/components/SubNavInventory'

import PurchaseOrderList from '@/views/inventory/PurchaseOrderList'
import PurchaseOrderForm from '@/views/inventory/PurchaseOrderForm'
import PurchaseOrderView from '@/views/inventory/PurchaseOrderView'

import MaterialList from '@/views/inventory/MaterialList'
import MaterialView from '@/views/inventory/MaterialView'
import MaterialForm from '@/views/inventory/MaterialForm'
import MaterialMoveForm from '@/views/inventory/MaterialMoveForm'

import SupplierList from '@/views/inventory/SupplierList'
import SupplierForm from '@/views/inventory/SupplierForm'
import SupplierView from '@/views/inventory/SupplierView'

import StockLocationList from '@/views/inventory/StockLocationList'
import StockLocationView from '@/views/inventory/StockLocationView'
import StockLocationForm from '@/views/inventory/StockLocationForm'

import MutationList from '@/views/inventory/MutationList'

import PurchaseOrderEntryList from '@/views/inventory/PurchaseOrderEntryList'
import PurchaseOrderEntryView from '@/views/inventory/PurchaseOrderEntryView'
import PurchaseOrderEntryForm from '@/views/inventory/PurchaseOrderEntryForm'

import SupplierReservationList from '@/views/inventory/SupplierReservationList'
import SupplierReservationForm from '@/views/inventory/SupplierReservationForm'

import Stats from '@/views/inventory/Stats'


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
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'purchaseorder-view',
        path: '/inventory/purchaseorders/view/:pk',
        components: {
          'app-content': PurchaseOrderView,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'purchaseorder-edit',
        path: '/inventory/purchaseorders/form/:pk',
        components: {
          'app-content': PurchaseOrderForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'purchaseorder-add',
        path: '/inventory/purchaseorders/form',
        components: {
          'app-content': PurchaseOrderForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
      {
        name: 'purchaseorder-add-from-reservation',
        path: '/inventory/purchaseorders/from/reservation/:reservation_pk',
        components: {
          'app-content': PurchaseOrderForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': true
        },
      },
      // materials
      {
        name: 'material-list',
        path: '/inventory/materials',
        components: {
          'app-content': MaterialList,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'material-view',
        path: '/inventory/materials/view/:pk',
        components: {
          'app-content': MaterialView,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'material-edit',
        path: '/inventory/materials/form/:pk',
        components: {
          'app-content': MaterialForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'material-add',
        path: '/inventory/materials/form',
        components: {
          'app-content': MaterialForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
      // suppliers
      {
        name: 'supplier-list',
        path: '/inventory/suppliers',
        components: {
          'app-content': SupplierList,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'supplier-view',
        path: '/inventory/suppliers/view/:pk',
        components: {
          'app-content': SupplierView,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'supplier-edit',
        path: '/inventory/suppliers/form/:pk',
        components: {
          'app-content': SupplierForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'supplier-add',
        path: '/inventory/suppliers/form',
        components: {
          'app-content': SupplierForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
      // supplier reservations
      {
        name: 'supplier-reservation-list',
        path: '/inventory/supplier-reservations',
        components: {
          'app-content': SupplierReservationList,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'supplier-reservation-edit',
        path: '/inventory/supplier-reservations/form/:pk',
        components: {
          'app-content': SupplierReservationForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'supplier-reservation-add',
        path: '/inventory/supplier-reservations/form',
        components: {
          'app-content': SupplierReservationForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
      // stock-locations
      {
        name: 'stock-location-list',
        path: '/inventory/stock-locations',
        components: {
          'app-content': StockLocationList,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'stock-location-view',
        path: '/inventory/stock-locations/view/:pk',
        components: {
          'app-content': StockLocationView,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'stock-location-edit',
        path: '/inventory/stock-locations/form/:pk',
        components: {
          'app-content': StockLocationForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'stock-location-add',
        path: '/inventory/stock-locations/form',
        components: {
          'app-content': StockLocationForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
      // mutations
      {
        name: 'mutation-list',
        path: '/inventory/mutations',
        components: {
          'app-content': MutationList,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      // purchase order entries
      {
        name: 'purchaseorder-entry-list',
        path: '/inventory/purchaseorder-entries',
        components: {
          'app-content': PurchaseOrderEntryList,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'purchaseorder-entry-view',
        path: '/inventory/purchaseorder-entries/view/:pk',
        components: {
          'app-content': PurchaseOrderEntryView,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'purchaseorder-entry-edit',
        path: '/inventory/purchaseorder-entries/form/:pk',
        components: {
          'app-content': PurchaseOrderEntryForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'purchaseorder-entry-add',
        path: '/inventory/purchaseorder-entries/form',
        components: {
          'app-content': PurchaseOrderEntryForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
      // move material
      {
        name: 'material-move',
        path: '/inventory/move-material',
        components: {
          'app-content': MaterialMoveForm,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
      // stats
      {
        name: 'inventory-stats',
        path: '/inventory/stats',
        components: {
          'app-content': Stats,
          'app-subnav': SubNavInventory
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },

    ]
  }]
