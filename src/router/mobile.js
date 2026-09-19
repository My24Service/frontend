import TheAppLayout from '@/components/TheAppLayout.vue'
import SubNav from '@/components/SubNav.vue'
import {OrderList} from '@/features/order'
import AssignedFinished from '@/views/mobile/AssignedFinished.vue'
import TimeSheet from '@/views/mobile/TimeSheet.vue'
import TimeSheetDetail from '@/views/mobile/TimeSheetDetail.vue'
import TripList from '@/views/mobile/TripList.vue'
import TripAvailability from '@/views/mobile/TripAvailability.vue'
import TripAvailabilityDetail from '@/views/mobile/TripAvailabilityDetail.vue'
import TripForm from '@/views/mobile/TripForm.vue'
import AssignedOrderMaterial from '@/views/mobile/AssignedOrderMaterial.vue'
import Dispatch from "@/views/mobile/Dispatch.vue";
import EngineerMap from "@/views/mobile/EngineerMap.vue";

export default [
{
  path: '/mobile',
  component: TheAppLayout,
  children: [
      {
        name: 'mobile-dispatch',
        path: '/mobile/dispatch/:assignModeProp?',
        components: {
          'app-content': Dispatch,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'mobile' }
        },
      },
      {
        name: 'mobile-map',
        path: '/mobile/map',
        components: {
          'app-content': EngineerMap,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'mobile' }
        },
      },
      {
        name: 'mobile-orders',
        path: '/mobile/orders',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {dispatch: true, queryMode: 'dispatch'},
          'app-subnav': { section: 'mobile' }
        },
      },
      {
        name: 'mobile-orders-in-progress',
        path: '/mobile/orders-in-progress',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {dispatch: true, queryMode: 'inprogress'},
          'app-subnav': { section: 'mobile' }
        },
      },
      {
        name: 'mobile-orders-finished',
        path: '/mobile/orders-finished',
        components: {
          'app-content': OrderList,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {dispatch: true, queryMode: 'finished'},
          'app-subnav': { section: 'mobile' }
        },
      },
      {
        name: 'mobile-assigned-finished',
        path: '/mobile/assigned-finished',
        components: {
          'app-content': AssignedFinished,
          'app-subnav': SubNav
        },
        props: {
          'app-subnav': { section: 'mobile' },
        },
      },
      {
        name: 'mobile-timesheet',
        path: '/mobile/timesheet',
        components: {
          'app-content': TimeSheet,
          'app-subnav': SubNav
        },
        props: {
          'app-subnav': { section: 'mobile' },
        },
      },
      {
        name: 'mobile-timesheet-detail',
        path: '/mobile/timesheet/:user_id',
        components: {
          'app-content': TimeSheetDetail,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'mobile' }
        },
      },
      {
        name: 'mobile-trips',
        path: '/mobile/trips',
        components: {
          'app-content': TripList,
          'app-subnav': SubNav
        },
        props: {
          'app-subnav': { section: 'mobile' },
        },
      },
      {
        name: 'mobile-trip-availability',
        path: '/mobile/trip-availability',
        components: {
          'app-content': TripAvailability,
          'app-subnav': SubNav
        },
        props: {
          'app-subnav': { section: 'mobile' },
        },
      },
      {
        name: 'mobile-trip-availability-detail',
        path: '/mobile/trip-availability/:pk',
        components: {
          'app-content': TripAvailabilityDetail,
          'app-subnav': SubNav
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'mobile' }
        },
      },
      {
        name: 'mobile-trips-edit',
        path: '/mobile/trips/form/:pk',
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': { section: 'mobile' }
        },
        components: {
          'app-content': TripForm,
          'app-subnav': SubNav
        },
      },
      {
        name: 'mobile-trips-add',
        path: '/mobile/trips/form',
        components: {
          'app-content': TripForm,
          'app-subnav': SubNav
        },
        props: {
          'app-content': {},
          'app-subnav': { section: 'mobile' }
        },
      },
  ]
}]
