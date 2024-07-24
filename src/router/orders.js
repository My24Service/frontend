import TheAppLayoutEmpty from '../components/TheAppLayoutEmpty.vue'
import Workorder from '../views/orders/Workorder.vue'

import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavOrders from '../components/SubNavOrders.vue'

import StatuscodeList from '../views/shared/StatuscodeList.vue'
import StatuscodeForm from '../views/shared/StatuscodeForm.vue'
import ActionForm from '../views/shared/ActionForm.vue'

import OrderList from '../views/orders/OrderList.vue'
import OrderForm from '../views/orders/OrderForm.vue'
import OrderView from '../views/orders/OrderView.vue'

import YearStats from '../views/orders/YearStats.vue'
import MonthStats from '../views/orders/MonthStats.vue'
import {AUTH_LEVELS} from "@/constants";

import InvoiceList from '../views/orders/InvoiceList'
import InvoiceForm from "../views/orders/InvoiceForm";
import InvoiceView from "../views/orders/InvoiceView";
import {USER_FILTER_TYPE_ORDER} from "@/models/base_user_filter";
import {createUserFilterRoutes} from "./helpers";

export default [
// orders
{
  component: TheAppLayoutEmpty,
  path: '/orders',
  children: [
      {
        meta: { needsAuth: false },
        name: 'workorder-view',
        path: '/orders/orders/workorder/:uuid',
        components: {
          'app-content': Workorder,
        },
        props: {
          'app-content': route => ({...route.params})
        },
      },
      {
        name: 'order-invoice-view',
        path: '/orders/invoice/view/:uuid',
        props: {
          'app-content': route => ({...route.params}),
        },
        components: {
          'app-content': InvoiceView,
        },
      },
  ]
},
{
  path: '/orders',
  component: TheAppLayout,
  children: [
    // orders
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
      name: 'order-list',
      path: '/orders/orders',
      components: {
        'app-content': OrderList,
        'app-subnav': SubNavOrders
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
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
      meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
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
      name: 'order-add-quotation',
      path: '/orders/orders/form-maintenance/:quotation_id',
      components: {
        'app-content': OrderForm,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params, from_quotation: true}),
        'app-subnav': true
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
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
      meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
      name: 'order-detail',
      path: '/orders/orders/detail/:uuid',
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
      meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
      name: 'orders-not-accepted',
      path: '/orders/orders-not-accepted',
      components: {
        'app-content': OrderList,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params, queryMode: 'unaccepted'}),
        'app-subnav': true
      }
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
      meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
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
      meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
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
    // invoices
    {
      name: 'order-invoice-list',
      path: '/orders/invoices',
      components: {
        'app-content': InvoiceList,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params, list_type: 'order'}),
        'app-subnav': true
      },
    },
    {
      name: 'order-invoice-create',
      path: '/orders/invoice/form/:uuid',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': InvoiceForm,
        'app-subnav': SubNavOrders
      },
    },
    // filters
    ...createUserFilterRoutes('order', 'orders', USER_FILTER_TYPE_ORDER),

  ],
}
];
