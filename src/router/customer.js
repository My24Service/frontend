import TheAppLayout from '@/components/TheAppLayout.vue'
import SubNavCustomers from '@/components/SubNavCustomers.vue'

import CustomerList from '@/views/customer/CustomerList.vue'
import CustomerForm from '@/views/customer/CustomerForm.vue'
import CustomerView from '@/views/customer/CustomerView.vue'

import DocumentList from '@/views/customer/DocumentList.vue'
import DocumentForm from '@/views/customer/DocumentForm.vue'

import MaintenanceProductsAll from '@/views/customer/MaintenanceProductsAll.vue'
import MaintenanceProductList from '@/views/customer/MaintenanceProductList.vue'

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
    {
      name: 'maintenance-products-all',
      path: '/customers/maintenance-products-all',
      components: {
        'app-content': MaintenanceProductsAll,
        'app-subnav': SubNavCustomers
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
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
  ]
}]
