import TheAppLayout from '../components/TheAppLayout.vue'
import SubNav from '../components/SubNav.vue'

import {MonthStats, OrderForm, OrderList, OrderView, OrdersSchedule, WorkorderPage, YearStats} from '@/features/order'

import {AUTH_LEVELS} from "@/constants";


import {USER_FILTER_TYPE_ORDER} from "@/models/base_user_filter";
import {createUserFilterRoutes} from "./helpers";

export default [
  // orders
  {
    component: TheAppLayout,
    props: { bare: true },
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
              'app-subnav': SubNav
            },
            props: {
              'app-subnav': { section: 'orders' },
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
                  'app-subnav': SubNav
                },
                props: {
                  'app-content': route => ({...route.params}),
                  'app-subnav': { section: 'orders' }
                },
              },
              {
                name: 'order-edit',
                path: ':pk(\\d+)',
                props: {
                  'app-content': route => ({...route.params}),
                  'app-subnav': { section: 'orders' }
                },
                components: {
                  'app-content': OrderForm,
                  'app-subnav': SubNav
                },
              },
            ],
     	    },
          {
            name: 'order-add-maintenance',
            path: 'form-maintenance',
            components: {
              'app-content': OrderForm,
              'app-subnav': SubNav
            },
            props: {
              'app-content': {maintenance: true},
              'app-subnav': { section: 'orders' }
            },
          },
          // A sibling, not a child of the maintenance route: the form renders
          // no nested router-view, so a child's props never reached it.
          {
            name: 'order-add-quotation',
            path: 'form-maintenance/:quotation_id',
            components: {
              'app-content': OrderForm,
              'app-subnav': SubNav
            },
            props: {
              'app-content': route => ({quotationId: route.params.quotation_id, fromQuotation: true}),
              'app-subnav': { section: 'orders' }
            },
          },
          {
            name: 'order-view',
            path: 'view/:pk',
            props: {
              'app-content': route => ({...route.params}),
              'app-subnav': { section: 'orders' }
            },
            components: {
              'app-content': OrderView,
              'app-subnav': SubNav
            },
          },
          {
            name: 'order-detail',
            path: 'detail/:uuid',
            props: {
              'app-content': route => ({...route.params}),
              'app-subnav': { section: 'orders' }
            },
            components: {
              'app-content': OrderView,
              'app-subnav': SubNav
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
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'orders' }
        },
      },
      {
        meta: { authLevelNeeded: [
            AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE, AUTH_LEVELS.CUSTOMER] },
        name: 'orders-schedule',
        path: 'schedule',
        components: {
          'app-content': OrdersSchedule,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'orders' }
        },
      },

      // stats
      {
        meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
        name: 'order-year-stats',
        path: 'year-stats',
        components: {
          'app-content': YearStats,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'orders' }
        },
      },
      {
        meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
        name: 'order-month-stats',
        path: 'month-stats',
        components: {
          'app-content': MonthStats,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'orders' }
        },
      },
      {
        meta: { authLevelNeeded: [AUTH_LEVELS.CUSTOMER, AUTH_LEVELS.EMPLOYEE] },
        name: 'orders-not-accepted',
        path: 'orders-not-accepted',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params, queryMode: 'unaccepted'}),
          'app-subnav': { section: 'orders' }
        }
      },
      // filters
      ...createUserFilterRoutes('order', 'orders', USER_FILTER_TYPE_ORDER),

    ],
  }
];
