import TheAppLayout from '@/components/TheAppLayout'
import SubNavCustomers from '@/components/SubNavCustomers'

import CustomerList from '@/views/customer/CustomerList'
import CustomerForm from '@/views/customer/CustomerForm'
import CustomerView from '@/views/customer/CustomerView'

import DocumentList from '@/views/customer/DocumentList'
import DocumentForm from '@/views/customer/DocumentForm'


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
        'app-content': route => ({...route.params, edit: true}),
        'app-subnav': true
      },
    },
  ]
}]
