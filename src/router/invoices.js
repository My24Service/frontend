import TheAppLayoutEmpty from '../components/TheAppLayoutEmpty.vue'
import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavInvoices from '../components/SubNavInvoices.vue'
import InvoiceForm from "../views/invoices/InvoiceForm";
import InvoiceView from "../views/invoices/InvoiceView";
import InvoiceList from "../views/invoices/InvoiceList";

export default [
// orders
{
  component: TheAppLayoutEmpty,
  path: '/invoices',
  children: [
    {
      name: 'invoice-view',
      path: '/invoices/invoice/view/:uuid',
      props: {
        'app-content': route => ({...route.params}),
      },
      components: {
        'app-content': InvoiceView,
      },
    },
  ]
},
{
  path: '/invoices',
  component: TheAppLayout,
  children: [
    {
      name: 'invoice-list',
      path: '/invoices/invoices',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': InvoiceList,
        'app-subnav': SubNavInvoices
      },
    },
    {
      name: 'invoice-create',
      path: '/invoices/invoice/form/:uuid',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': InvoiceForm,
        'app-subnav': SubNavInvoices
      },
    },
    {
      name: 'invoice-edit',
      path: '/invoices/invoice/form/:pk/order/:uuid',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': InvoiceForm,
        'app-subnav': SubNavInvoices
      },
    },
  ],
}
];
