import TheAppLayoutEmpty from '../components/TheAppLayoutEmpty.vue'
import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavInvoices from '../components/SubNavInvoices.vue'
import InvoiceForm from "../views/invoices/InvoiceForm";
import InvoiceView from "../views/invoices/InvoiceView";
import InvoiceList from "../views/invoices/InvoiceList";
import EmailForm from "../views/invoices/EmailForm";
import {AUTH_LEVELS} from "@/constants";

export default [
{
  path: '/invoices',
  component: TheAppLayout,
  children: [
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoice-view',
      path: '/invoices/invoices/view/:uuid',
      components: {
        'app-content': InvoiceView,
        'app-subnav': SubNavInvoices
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
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
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'preliminary-invoices',
      path: '/invoices/preliminary',
      components: {
        'app-content': InvoiceList,
        'app-subnav': SubNavInvoices
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoices-sent',
      path: '/invoices/sent',
      components: {
        'app-content': InvoiceList,
        'app-subnav': SubNavInvoices
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoice-create',
      path: '/invoices/preliminary/form/:uuid',
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
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoice-edit',
      path: '/invoices/preliminary/form/:pk/order/:uuid',
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
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoice-send',
      path: '/invoices/sent/form/',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': EmailForm,
        'app-subnav': SubNavInvoices
      },
    }
  ],
}
];
