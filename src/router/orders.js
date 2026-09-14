import TheAppLayoutEmpty from '../components/TheAppLayoutEmpty.vue'

import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavOrders from '../components/SubNavOrders.vue'

import {OrderForm, OrderList, OrderView, WorkorderPage} from '@/features/order'

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
        path: 'orders/workorder/:uuid',
        components: {
          'app-content': WorkorderPage,
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
        path: 'orders',
        children: [
          {
            name: 'order-list',
            path: '',
            components: {
              'app-content': OrderList,
              'app-subnav': SubNavOrders
            },
          },
          {
            path: 'form',
            children: [
              {
                name: 'order-add',
                path: '',
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
                name: 'order-edit',
                path: ':pk(\\d+)',
                props: {
                  'app-content': route => ({...route.params}),
                  'app-subnav': true
                },
                components: {
                  'app-content': OrderForm,
                  'app-subnav': SubNavOrders
                },
              },
            ],
     	    },
          {
            name: 'order-add-maintenance',
            path: 'form-maintenance',
            components: {
              'app-content': OrderForm,
              'app-subnav': SubNavOrders
            },
            props: {
              'app-content': {maintenance: true},
              'app-subnav': true
            },
          },
          // A sibling, not a child of the maintenance route: the form renders
          // no nested router-view, so a child's props never reached it.
          {
            name: 'order-add-quotation',
            path: 'form-maintenance/:quotation_id',
            components: {
              'app-content': OrderForm,
              'app-subnav': SubNavOrders
            },
            props: {
              'app-content': route => ({quotationId: route.params.quotation_id, fromQuotation: true}),
              'app-subnav': true
            },
          },
          {
            name: 'order-view',
            path: 'view/:pk',
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
            name: 'order-detail',
            path: 'detail/:uuid',
            props: {
              'app-content': route => ({...route.params}),
              'app-subnav': true
            },
            components: {
              'app-content': OrderView,
              'app-subnav': SubNavOrders
            },
          },
        ],
      },
      // calendar/schedule
      {
        meta: { authLevelNeeded: [
          AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE, AUTH_LEVELS.CUSTOMER] },
        name: 'orders-schedule-params',
        path: 'schedule/:start/:end',
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
        path: 'schedule',
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
        path: 'year-stats',
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
        path: 'month-stats',
        components: {
          'app-content': MonthStats,
          'app-subnav': SubNavOrders
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
        name: 'orders-not-accepted',
        path: 'orders-not-accepted',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNavOrders
        },
        props: {
          'app-content': route => ({...route.params, queryMode: 'unaccepted'}),
          'app-subnav': true
        }
      },
      // filters
      ...createUserFilterRoutes('order', 'orders', USER_FILTER_TYPE_ORDER),

    ],
  }
];
