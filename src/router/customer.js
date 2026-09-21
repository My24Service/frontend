import TheAppLayout from '../components/TheAppLayout.vue'
import SubNav from '../components/SubNav.vue'

// The Customer screens and the maintenance-contract screens live in the
// feature folder; this file only routes them. The equipment/location screens
// come from the equipment Slice too — the same components are mounted by
// router/equipment.js and router/settings.js, which is why that Slice owns all
// three name families. Their forms are still the legacy views until the
// equipment Slice's form step.
import {
  CustomerForm,
  CustomerList,
  CustomerView,
  MaintenanceContractForm,
  MaintenanceContractList,
  MaintenanceContractView,
} from '@/features/customer'

import {
  EquipmentList,
  EquipmentForm,
  LocationList,
  LocationForm,
  EquipmentDetail,
  LocationDetail,
} from '@/features/equipment'


import {AUTH_LEVELS, EQUIPMENT_TYPES} from "@/constants";

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
        'app-subnav': SubNav
      },
      props: {
        'app-subnav': { section: 'customers' },
      },
    },
    {
      name: 'customer-list',
      path: '/customers/customers',
      components: {
        'app-content': CustomerList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'customers' }
      },
    },
    {
      name: 'customer-edit',
      path: '/customers/customers/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'customers' }
      },
      components: {
        'app-content': CustomerForm,
        'app-subnav': SubNav
      },
    },
    {
      name: 'customer-add',
      path: '/customers/customers/form',
      components: {
        'app-content': CustomerForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'customers' }
      },
    },
    {
      name: 'customer-view',
      path: '/customers/customers/:pk',
      components: {
        'app-content': CustomerView,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'customers' }
      },
    },
    // TODO fix this
    // {
    //   path: 'customers',
    //   components: {
    //     'app-subnav': SubNav,
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
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'customers' }
      },
    },
    {
      name: 'maintenance-contract-edit',
      path: '/customers/maintenance-contracts/form/:pk',
      components: {
        'app-content': MaintenanceContractForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'customers' }
      },
    },
    {
      name: 'maintenance-contract-add',
      path: '/customers/maintenance-contracts/form',
      components: {
        'app-content': MaintenanceContractForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'customers' }
      },
    },
    {
      name: 'maintenance-contract-view',
      path: '/customers/maintenance-contracts/view/:pk',
      components: {
        'app-content': MaintenanceContractView,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'customers' }
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
            'app-subnav': SubNav
          },
          props: {
            'app-subnav': { section: 'customers' },
          },
        },
        {
          name: 'customers-equipment-edit',
          path: 'form/:pk',
          components: {
            'app-content': EquipmentForm,
            'app-subnav': SubNav
          },
          props: {
            'app-subnav': { section: 'customers' },
          },
        },
        {
          name: 'customers-equipment-view',
          path: ':pk',
          components: {
            'app-content': EquipmentDetail,
            'app-subnav': SubNav
          },
          props: {
            'app-subnav': { section: 'customers' },
          },
        },
        {
          name: 'customers-equipment-add',
          path: 'form',
          components: {
            'app-content': EquipmentForm,
            'app-subnav': SubNav
          },
          props: {
            'app-subnav': { section: 'customers' },
          },
        },
        // A branch member's equipment list links each row to the `-view-<type>`
        // name and the detail page edits through `-edit-<type>`, so the untyped
        // pair above is not enough here. Mirrors router/equipment.js.
        ...Object.values(EQUIPMENT_TYPES).map((item) => {
          return {
            name: `customers-equipment-view-${item}`,
            path: `${item}/:pk`,
            components: {
              'app-content': EquipmentDetail,
              'app-subnav': SubNav
            },
            props: {
              'app-subnav': { section: 'customers' },
            },
          }
        }),
        ...Object.values(EQUIPMENT_TYPES).map((item) => {
          return {
            name: `customers-equipment-edit-${item}`,
            path: `${item}/form/:pk`,
            components: {
              'app-content': EquipmentForm,
              'app-subnav': SubNav
            },
            props: {
              'app-subnav': { section: 'customers' },
            },
          }
        }),
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
            'app-subnav': SubNav
          },
          props: {
            'app-subnav': { section: 'customers' },
          },
        },
        {
          name: 'customers-location-edit',
          path: 'form/:pk',
          components: {
            'app-content': LocationForm,
            'app-subnav': SubNav
          },
          props: {
            'app-subnav': { section: 'customers' },
          },
        },
        {
          name: 'customers-location-view',
          path: ':pk',
          components: {
            'app-content': LocationDetail,
            'app-subnav': SubNav
          },
          props: {
            'app-subnav': { section: 'customers' },
          },
        },
        {
          name: 'customers-location-add',
          path: 'form',
          components: {
            'app-content': LocationForm,
            'app-subnav': SubNav
          },
          props: {
            'app-subnav': { section: 'customers' },
          },
        },
      ],
    },
  ]
}]
