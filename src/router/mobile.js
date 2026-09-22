import TheAppLayout from '@/components/TheAppLayout.vue'
import SubNav from '@/components/SubNav.vue'
import {OrderList} from '@/features/order'
import {
  AssignedFinished,
  Dispatch,
  EngineerMap,
  TimeSheet,
  TimeSheetDetail,
  TripAvailability,
  TripAvailabilityDetail,
  TripForm,
  TripList,
} from '@/features/field-service'

/**
 * The mobile section's routes.
 *
 * The three `/mobile/orders*` lists belong to the order Slice and stay where
 * they are; everything else here is the field-service Slice's, imported through
 * its door. Every name and path is unchanged — they are bookmarked, and the
 * specs assert them verbatim.
 */
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
