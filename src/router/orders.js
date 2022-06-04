import TheAppLayoutEmpty from '@/components/TheAppLayoutEmpty.vue'
import Workorder from '@/views/orders/Workorder.vue'

import TheAppLayout from '@/components/TheAppLayout.vue'
import SubNavOrders from '@/components/SubNavOrders.vue'

import StatuscodeList from '@/views/shared/StatuscodeList.vue'
import StatuscodeForm from '@/views/shared/StatuscodeForm.vue'
import ActionForm from '@/views/shared/ActionForm.vue'

import OrderList from '@/views/orders/OrderList.vue'
import OrderListPast from '@/views/orders/OrderListPast.vue'
import OrderListSales from '@/views/orders/OrderListSales.vue'
import OrderListNotAccepted from '@/views/orders/OrderListNotAccepted.vue'
import OrderListWorkorder from '@/views/orders/OrderListWorkorder.vue'
import OrderForm from '@/views/orders/OrderForm.vue'
import OrderView from '@/views/orders/OrderView.vue'
import DocumentList from '@/views/orders/DocumentList.vue'
import DocumentForm from '@/views/orders/DocumentForm.vue'

import YearStats from '@/views/orders/YearStats.vue'
import MonthStats from '@/views/orders/MonthStats.vue'


export default [
// orders
{
  component: TheAppLayoutEmpty,
  path: '/orders',
  children: [
      {
        name: 'workorder-view',
        path: '/orders/orders/workorder/:uuid',
        components: {
          'app-content': Workorder,
        },
        props: {
          'app-content': route => ({...route.params})
        },
      }
  ]
},
{
  path: '/orders',
  component: TheAppLayout,
  children: [
    // orders
    {
      name: 'order-list',
      path: '/orders/orders',
      components: {
        'app-content': OrderList,
        'app-subnav': SubNavOrders
      },
    },
    {
      name: 'order-edit',
      path: '/orders/orders/form/:pk(\\d+)',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': OrderForm,
        'app-subnav': SubNavOrders
      },
    },
    {
      name: 'order-add',
      path: '/orders/orders/form',
      components: {
        'app-content': OrderForm,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
	  },
    {
      name: 'order-add-maintenance',
      path: '/orders/orders/form-maintenance',
      components: {
        'app-content': OrderForm,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': {maintenance: true},
        'app-subnav': true
      },
    },
    {
      name: 'order-view',
      path: '/orders/orders/view/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': OrderView,
        'app-subnav': SubNavOrders
      },
    },
	  {
	  	name: 'past-order-list',
			path: '/orders/past-orders',
			components: {
			  'app-content': OrderListPast,
			  'app-subnav': SubNavOrders
			}
	  },
    {
      name: 'order-list-sales',
      path: '/orders/sales-orders',
      components: {
        'app-content': OrderListSales,
        'app-subnav': SubNavOrders
      }
    },
    {
      name: 'orders-not-accepted',
      path: '/orders/orders-not-accepted',
      components: {
        'app-content': OrderListNotAccepted,
        'app-subnav': SubNavOrders
      }
    },
    {
      name: 'workorder-orders',
      path: '/orders/workorder-orders',
      components: {
        'app-content': OrderListWorkorder,
        'app-subnav': SubNavOrders
      }
    },
    // documents
    {
      name: 'order-documents',
      path: '/orders/orders/documents/:orderPk',
      components: {
        'app-content': DocumentList,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'order-document-add',
      path: '/orders/orders/documents/form/:orderPk',
      components: {
        'app-content': DocumentForm,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'order-document-edit',
      path: '/orders/orders/documents/edit/:pk',
      components: {
        'app-content': DocumentForm,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params, edit: true}),
        'app-subnav': true
      },
    },
    // statuscodes
    {
      name: 'order-statuscode-list',
      path: '/orders/statuscodes',
      components: {
        'app-content': StatuscodeList,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params, list_type: 'order'}),
        'app-subnav': true
      },
    },
    {
      name: 'order-statuscode-edit',
      path: '/orders/statuscodes/form/:pk',
      props: {
        'app-content': route => ({...route.params, list_type: 'order'}),
        'app-subnav': true
      },
      components: {
        'app-content': StatuscodeForm,
        'app-subnav': SubNavOrders
      },
    },
    {
      name: 'order-statuscode-add',
      path: '/orders/statuscodes/form',
      components: {
        'app-content': StatuscodeForm,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params, list_type: 'order'}),
        'app-subnav': true
      },
    },
    // actions
    {
      name: 'order-statuscode-action-edit',
      path: '/orders/statuscodes/action/form/:pk',
      props: {
        'app-content': route => ({...route.params, list_type: 'order'}),
        'app-subnav': true
      },
      components: {
        'app-content': ActionForm,
        'app-subnav': SubNavOrders
      },
    },
    {
      name: 'order-statuscode-action-add',
      path: '/orders/statuscodes/action/form',
      components: {
        'app-content': ActionForm,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params, list_type: 'order'}),
        'app-subnav': true
      },
    },
    // stats
    {
      name: 'order-year-stats',
      path: '/orders/year-stats',
      components: {
        'app-content': YearStats,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
    },
    {
      name: 'order-month-stats',
      path: '/orders/month-stats',
      components: {
        'app-content': MonthStats,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
    },
  ],
}
];
