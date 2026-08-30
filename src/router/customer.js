import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavCustomers from '../components/SubNavCustomers.vue'

// The Customer screens and the maintenance-contract screens live in the
// feature folder; this file only routes them. The equipment/location screens
// are not converted yet and import the legacy views until their own Slice
// moves them — they are shared with the standalone /equipment section (the
// same components are mounted by router/equipment.js and router/settings.js),
// so they are that Slice's to move, not this one's.
import {
  CustomerForm,
  CustomerList,
  CustomerListTable,
  CustomerView,
  MaintenanceContractForm,
  MaintenanceContractList,
  MaintenanceContractListTable,
  MaintenanceContractView,
} from '@/features/customer'

import EquipmentList from '../views/equipment/EquipmentList.vue'
import EquipmentForm from '../views/equipment/EquipmentForm.vue'

import LocationList from '../views/equipment/LocationList.vue'
import LocationForm from '../views/equipment/LocationForm.vue'

import {AUTH_LEVELS} from "@/constants";
import EquipmentView from "../views/equipment/EquipmentView";
import LocationView from "../views/equipment/LocationView";

export default [
{
  path: '/customers',
  component: TheAppLayout,
  children: [
    {
      meta: { authLevelNeeded: AUTH_LEVELS.CUSTOMER },
      name: 'customer-dashboard',
      path: 'dashboard',
      components: {
        'app-content': CustomerView,
        'app-subnav': SubNavCustomers
      },
    },
    {
      name: 'customer-list',
      path: '/customers/customers',
      components: {
        'app-content': CustomerList,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // PROTOTYPE (TanStack Table experiment): throwaway route, compare with
    // customer-list before deciding. Delete with the experiment.
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'customer-list-table-prototype',
      path: '/customers/customers-table',
      components: {
        'app-content': CustomerListTable,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // PROTOTYPE (TanStack Table experiment): throwaway route for the
    // maintenance-contract list. Delete with the experiment.
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'maintenance-contract-list-table-prototype',
      path: '/customers/maintenance-contracts-table',
      components: {
        'app-content': MaintenanceContractListTable,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'customer-edit',
      path: '/customers/customers/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': CustomerForm,
        'app-subnav': SubNavCustomers
      },
    },
    {
      name: 'customer-add',
      path: '/customers/customers/form',
      components: {
        'app-content': CustomerForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'customer-view',
      path: '/customers/customers/:pk',
      components: {
        'app-content': CustomerView,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
    },
    // TODO fix this
    // {
    //   path: 'customers',
    //   components: {
    //     'app-subnav': SubNavCustomers,
    //   },
    //   children: [
    //     {
    //       name: 'customer-list',
    //       path: '',
    //       components: {
    //         'app-content': CustomerList,
    //       },
    //     },
    //     {
    //       name: 'customer-edit',
    //       path: 'form/:pk',
    //       components: {
    //         'app-content': CustomerForm,
    //       },
    //     },
    //     {
    //       name: 'customer-add',
    //       path: 'form',
    //       components: {
    //         'app-content': CustomerForm,
    //       },
    //     },
    //     {
    //       name: 'customer-view',
    //       path: ':pk',
    //       components: {
    //         'app-content': CustomerView,
    //       },
    //     },
    //   ],
    // },
    // maintenance contracts
    {
      name: 'maintenance-contracts',
      path: '/customers/maintenance-contracts',
      components: {
        'app-content': MaintenanceContractList,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': true
      },
    },
    {
      name: 'maintenance-contract-edit',
      path: '/customers/maintenance-contracts/form/:pk',
      components: {
        'app-content': MaintenanceContractForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': true
      },
    },
    {
      name: 'maintenance-contract-add',
      path: '/customers/maintenance-contracts/form',
      components: {
        'app-content': MaintenanceContractForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': true
      },
    },
    {
      name: 'maintenance-contract-view',
      path: '/customers/maintenance-contracts/view/:pk',
      components: {
        'app-content': MaintenanceContractView,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': true
      },
    },
    // equipment
    {
      path: '/customers/equipment',
      meta: {
        props: {
          route_prefix: 'customers-equipment'
        },
      },
      children: [
        {
          name: 'customers-equipment-list',
          path: '',
          components: {
            'app-content': EquipmentList,
            'app-subnav': SubNavCustomers
          },
        },
        {
          name: 'customers-equipment-edit',
          path: 'form/:pk',
          components: {
            'app-content': EquipmentForm,
            'app-subnav': SubNavCustomers
          },
        },
        {
          name: 'customers-equipment-view',
          path: ':pk',
          components: {
            'app-content': EquipmentView,
            'app-subnav': SubNavCustomers
          },
        },
        {
          name: 'customers-equipment-add',
          path: 'form',
          components: {
            'app-content': EquipmentForm,
            'app-subnav': SubNavCustomers
          },
        },
      ],
    },
    // locations
    {
      path: 'locations',
      meta: {
        props: {
          route_prefix: 'customers-location'
        },
      },
      children: [
        {
          name: 'customers-location-list',
          path: '',
          components: {
            'app-content': LocationList,
            'app-subnav': SubNavCustomers
          },
        },
        {
          name: 'customers-location-edit',
          path: 'form/:pk',
          components: {
            'app-content': LocationForm,
            'app-subnav': SubNavCustomers
          },
        },
        {
          name: 'customers-location-view',
          path: ':pk',
          components: {
            'app-content': LocationView,
            'app-subnav': SubNavCustomers
          },
        },
        {
          name: 'customers-location-add',
          path: 'form',
          components: {
            'app-content': LocationForm,
            'app-subnav': SubNavCustomers
          },
        },
      ],
    },
  ]
}]
