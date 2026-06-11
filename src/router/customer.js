import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavCustomers from '../components/SubNavCustomers.vue'

import CustomerList from '../views/customer/CustomerList.vue'
import CustomerForm from '../views/customer/CustomerForm.vue'
import CustomerView from '../views/customer/CustomerView.vue'

import MaintenanceContractList from '../views/customer/MaintenanceContractList.vue'
import MaintenanceContractForm from '../views/customer/MaintenanceContractForm.vue'
import MaintenanceContractView from '../views/customer/MaintenanceContractView.vue'

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
      path: 'customers',
      components: {
        'app-subnav': SubNavCustomers,
      },
      children: [
        {
          name: 'customer-list',
          path: '',
          components: {
            'app-content': CustomerList,
          },
        },
        {
          name: 'customer-edit',
          path: 'form/:pk',
          components: {
            'app-content': CustomerForm,
          },
        },
        {
          name: 'customer-add',
          path: 'form',
          components: {
            'app-content': CustomerForm,
          },
        },
        {
          name: 'customer-view',
          path: ':pk',
          components: {
            'app-content': CustomerView,
          },
        },
      ],
    },
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
