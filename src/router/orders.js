import TheAppLayoutEmpty from '../components/TheAppLayoutEmpty.vue'
import Workorder from '../views/orders/Workorder.vue'

import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavOrders from '../components/SubNavOrders.vue'

import OrderList from '../views/orders/OrderList.vue'
import OrderForm from '../views/orders/OrderForm.vue'
import OrderView from '../views/orders/OrderView.vue'

import YearStats from '../views/orders/YearStats.vue'
import MonthStats from '../views/orders/MonthStats.vue'
import {AUTH_LEVELS} from "@/constants";

import OrdersSchedule from "../views/orders/Schedule.vue";

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

    // calendar/schedule
    {
      meta: { authLevelNeeded: [
        AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE, AUTH_LEVELS.CUSTOMER] },
      name: 'orders-schedule-params',
      path: '/orders/schedule/:start/:end',
      components: {
        'app-content': OrdersSchedule,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      meta: { authLevelNeeded: [
          AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE, AUTH_LEVELS.CUSTOMER] },
      name: 'orders-schedule',
      path: '/orders/schedule',
      components: {
        'app-content': OrdersSchedule,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params}),
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
    // filters
    ...createUserFilterRoutes('order', 'orders', USER_FILTER_TYPE_ORDER),

  ],
}
];
