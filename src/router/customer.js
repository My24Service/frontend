import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavCustomers from '../components/SubNavCustomers.vue'

import CustomerList from '../views/customer/CustomerList.vue'
import CustomerForm from '../views/customer/CustomerForm.vue'
import CustomerView from '../views/customer/CustomerView.vue'

import DocumentList from '../views/customer/DocumentList.vue'
import DocumentForm from '../views/customer/DocumentForm.vue'

import MaintenanceContractList from '../views/customer/MaintenanceContractList.vue'
import MaintenanceContractForm from '../views/customer/MaintenanceContractForm.vue'

import MaintenanceEquipmentList from '../views/customer/MaintenanceEquipmentList.vue'
import MaintenanceEquipmentForm from '../views/customer/MaintenanceEquipmentForm.vue'

import EquipmentList from '../views/equipment/EquipmentList.vue'
import EquipmentForm from '../views/equipment/EquipmentForm.vue'

import LocationList from '../views/equipment/LocationList.vue'
import LocationForm from '../views/equipment/LocationForm.vue'

import Calendar from '../views/customer/Calendar.vue'
import SubNavEquipment from "../components/SubNavEquipment";

export default [
{
  path: '/customers',
  component: TheAppLayout,
  children: [
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
    // documents
    {
      name: 'customer-documents',
      path: '/customers/customers/documents/:customerPk',
      components: {
        'app-content': DocumentList,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'customer-document-add',
      path: '/customers/customers/documents/form/:customerPk',
      components: {
        'app-content': DocumentForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'customer-document-edit',
      path: '/customers/customers/documents/form/:pk',
      components: {
        'app-content': DocumentForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
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
        'app-content': route => ({...route.params}),
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
        'app-content': route => ({...route.params}),
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
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    // maintenance equipment
    {
      name: 'maintenance-equipment',
      path: '/customers/maintenance-equipment/:contractPk',
      components: {
        'app-content': MaintenanceEquipmentList,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'maintenance-equipment-add',
      path: '/customers/maintenance-equipment/form',
      components: {
        'app-content': MaintenanceEquipmentForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'maintenance-equipment-edit',
      path: '/customers/maintenance-equipment/form/:pk',
      components: {
        'app-content': MaintenanceEquipmentForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },

    // calendar
    {
      name: 'maintenance-products-calendar',
      path: '/customers/calendar',
      components: {
        'app-content': Calendar,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },

    // equipment
    {
      name: 'customers-equipment-list',
      path: '/customers/equipment',
      components: {
        'app-content': EquipmentList,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'customers-equipment-edit',
      path: '/customers/equipment/form/:pk',
      components: {
        'app-content': EquipmentForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
    },
    {
      name: 'customers-equipment-add',
      path: '/customers/equipment/form',
      components: {
        'app-content': EquipmentForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': true
      },
    },
    // locations
    {
      name: 'customers-location-list',
      path: '/customers/locations',
      components: {
        'app-content': LocationList,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'customers-location-edit',
      path: '/customers/locations/form/:pk',
      components: {
        'app-content': LocationForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
    },
    {
      name: 'customers-location-add',
      path: '/customers/locations/form',
      components: {
        'app-content': LocationForm,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': {},
        'app-subnav': true
      },
    },
  ]
}]
