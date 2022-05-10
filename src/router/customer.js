import TheAppLayout from '@/components/TheAppLayout.vue'
import SubNavCustomers from '@/components/SubNavCustomers.vue'

import CustomerList from '@/views/customer/CustomerList.vue'
import CustomerForm from '@/views/customer/CustomerForm.vue'
import CustomerView from '@/views/customer/CustomerView.vue'

import DocumentList from '@/views/customer/DocumentList.vue'
import DocumentForm from '@/views/customer/DocumentForm.vue'

import MaintenanceContractList from '@/views/customer/MaintenanceContractList.vue'
import MaintenanceContractForm from '@/views/customer/MaintenanceContractForm.vue'
import MaintenanceProductList from '@/views/customer/MaintenanceProductList.vue'
import MaintenanceProductForm from '@/views/customer/MaintenanceProductForm.vue'
import Calendar from '@/views/customer/Calendar.vue'

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
      path: '/customers/maintenance-contracts/:pk',
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
    // maintenance products
    {
      name: 'maintenance-products',
      path: '/customers/maintenance-products/:customer_pk',
      components: {
        'app-content': MaintenanceProductList,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'maintenance-product-add',
      path: '/customers/maintenance-products/form',
      components: {
        'app-content': MaintenanceProductForm,
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
  ]
}]
