import TheAppLayout from '../components/TheAppLayout.vue'
import SubNav from '../components/SubNav.vue'

import { InvoiceForm } from '@/features/invoice'
import { InvoiceView } from '@/features/invoice'
import { InvoiceList } from '@/features/invoice'
import { EmailForm } from '@/features/invoice'
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
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'invoices' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoice-list',
      path: '/invoices/invoices',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'invoices' }
      },
      components: {
        'app-content': InvoiceList,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'preliminary-invoices',
      path: '/invoices/preliminary',
      components: {
        'app-content': InvoiceList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'invoices' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoices-sent',
      path: '/invoices/sent',
      components: {
        'app-content': InvoiceList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'invoices' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoice-create',
      path: '/invoices/preliminary/form/:uuid',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'invoices' }
      },
      components: {
        'app-content': InvoiceForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoice-edit',
      path: '/invoices/preliminary/form/:pk/order/:uuid',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'invoices' }
      },
      components: {
        'app-content': InvoiceForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'invoice-send',
      path: '/invoices/sent/form/',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'invoices' }
      },
      components: {
        'app-content': EmailForm,
        'app-subnav': SubNav
      },
    }
  ],
}
];