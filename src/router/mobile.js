import TheAppLayout from '@/components/TheAppLayout.vue'
import SubNavMobile from '@/components/SubNavMobile.vue'

import StatuscodeList from '@/views/shared/StatuscodeList.vue'
import StatuscodeForm from '@/views/shared/StatuscodeForm.vue'
import ActionForm from '@/views/shared/ActionForm.vue'

import OrderList from '@/views/orders/OrderList.vue'
import AssignedFinished from '@/views/mobile/AssignedFinished.vue'
import TimeSheet from '@/views/mobile/TimeSheet.vue'
import TimeSheetDetail from '@/views/mobile/TimeSheetDetail.vue'
import TripList from '@/views/mobile/TripList.vue'
import TripAvailability from '@/views/mobile/TripAvailability.vue'
import TripAvailabilityDetail from '@/views/mobile/TripAvailabilityDetail.vue'
import TripForm from '@/views/mobile/TripForm.vue'
import AssignedOrderMaterial from '@/views/mobile/AssignedOrderMaterial.vue'
import Dispatch from "@/views/mobile/Dispatch.vue";

export default [
{
  path: '/mobile',
  component: TheAppLayout,
  children: [
      {
        name: 'mobile-dispatch',
        path: '/mobile/dispatch',
        components: {
          'app-content': Dispatch,
          'app-subnav': SubNavMobile
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'mobile-orders',
        path: '/mobile/orders',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNavMobile
        },
        props: {
          'app-content': {dispatch: true, queryMode: 'dispatch'},
          'app-subnav': {}
        },
      },
      {
        name: 'mobile-orders-in-progress',
        path: '/mobile/orders-in-progress',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNavMobile
        },
        props: {
          'app-content': {dispatch: true, queryMode: 'inprogress'},
          'app-subnav': {}
        },
      },
      {
        name: 'mobile-orders-finished',
        path: '/mobile/orders-finished',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNavMobile
        },
        props: {
          'app-content': {dispatch: true, queryMode: 'finished'},
          'app-subnav': {}
        },
      },
      {
        name: 'mobile-orders-unassigned',
        path: '/mobile/orders-unassigned',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNavMobile
        },
        props: {
          'app-content': {dispatch: true, queryMode: 'unassigned'},
          'app-subnav': {}
        },
      },
      {
        name: 'mobile-assigned-finished',
        path: '/mobile/assigned-finished',
        components: {
          'app-content': AssignedFinished,
          'app-subnav': SubNavMobile
        },
      },
      {
        name: 'mobile-timesheet',
        path: '/mobile/timesheet',
        components: {
          'app-content': TimeSheet,
          'app-subnav': SubNavMobile
        },
      },
      {
        name: 'mobile-timesheet-detail',
        path: '/mobile/timesheet/:user_id',
        components: {
          'app-content': TimeSheetDetail,
          'app-subnav': SubNavMobile
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': true
        },
      },
      {
        name: 'mobile-trips',
        path: '/mobile/trips',
        components: {
          'app-content': TripList,
          'app-subnav': SubNavMobile
        },
      },
      {
        name: 'mobile-trip-availability',
        path: '/mobile/trip-availability',
        components: {
          'app-content': TripAvailability,
          'app-subnav': SubNavMobile
        },
      },
      {
        name: 'mobile-trip-availability-detail',
        path: '/mobile/trip-availability/:pk',
        components: {
          'app-content': TripAvailabilityDetail,
          'app-subnav': SubNavMobile
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': true
        },
      },
      {
        name: 'mobile-trips-edit',
        path: '/mobile/trips/form/:pk',
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': true
        },
        components: {
          'app-content': TripForm,
          'app-subnav': SubNavMobile
        },
      },
      {
        name: 'mobile-trips-add',
        path: '/mobile/trips/form',
        components: {
          'app-content': TripForm,
          'app-subnav': SubNavMobile
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
    // statuscodes
    {
      name: 'trip-statuscode-list',
      path: '/mobile/trip-statuscodes',
      components: {
        'app-content': StatuscodeList,
        'app-subnav': SubNavMobile
      },
      props: {
        'app-content': route => ({...route.params, list_type: 'trip'}),
        'app-subnav': true
      },
    },
    {
      name: 'trip-statuscode-edit',
      path: '/mobile/trip-statuscodes/form/:pk',
      props: {
        'app-content': route => ({...route.params, list_type: 'trip'}),
        'app-subnav': true
      },
      components: {
        'app-content': StatuscodeForm,
        'app-subnav': SubNavMobile
      },
    },
    {
      name: 'trip-statuscode-add',
      path: '/mobile/trip-statuscodes/form',
      components: {
        'app-content': StatuscodeForm,
        'app-subnav': SubNavMobile
      },
      props: {
        'app-content': route => ({...route.params, list_type: 'trip'}),
        'app-subnav': true
      },
    },
    // actions
    {
      name: 'trip-statuscode-action-edit',
      path: '/mobile/trip-statuscodes/action/form/:pk',
      props: {
        'app-content': route => ({...route.params, list_type: 'trip'}),
        'app-subnav': true
      },
      components: {
        'app-content': ActionForm,
        'app-subnav': SubNavMobile
      },
    },
    {
      name: 'trip-statuscode-action-add',
      path: '/mobile/trip-statuscodes/action/form',
      components: {
        'app-content': ActionForm,
        'app-subnav': SubNavMobile
      },
      props: {
        'app-content': route => ({...route.params, list_type: 'trip'}),
        'app-subnav': true
      },
    },
    {
      name: 'assignedorder-materials',
      path: '/mobile/assignedorder-materials',
      components: {
        'app-content': AssignedOrderMaterial,
        'app-subnav': SubNavMobile
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
  ]
}]
