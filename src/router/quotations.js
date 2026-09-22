import TheAppLayout from '../components/TheAppLayout.vue'
import SubNav from '../components/SubNav.vue'

import {AUTH_LEVELS} from "@/constants";

// Route screens, split per chunk: the router holds a loader, not the module.
const OfferForm = () => import('@/views/quotations/OfferForm.vue')
const QuotationDetail = () => import('@/views/quotations/QuotationDetail.vue')
const QuotationForm = () => import('../views/quotations/QuotationForm.vue')
const QuotationList = () => import('../views/quotations/QuotationList.vue')
const QuotationView = () => import('@/views/quotations/QuotationView.vue')

export default [
{
  path: '/quotations',
  component: TheAppLayout,
  children: [
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-list',
      path: '/quotations/quotations',
      components: {
        'app-content': QuotationList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'quotations' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'preliminary-quotations',
      path: '/quotations/preliminary',
      components: {
        'app-content': QuotationList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-view',
      path: '/quotations/quotations/view/:pk',
      components: {
        'app-content': QuotationView,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotations-sent-view',
      path: '/quotations/sent/view/:pk',
      components: {
        'app-content': QuotationView,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotations-sent',
      path: '/quotations/sent',
      components: {
        'app-content': QuotationList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-add',
      path: '/quotations/preliminary/form',
      components: {
        'app-content': QuotationForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
	  },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-edit',
      path: '/quotations/quotations/form/:pk(\\d+)',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
      components: {
        'app-content': QuotationForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-edit-preliminary',
      path: '/quotations/preliminary/form/:pk(\\d+)',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
      components: {
        'app-content': QuotationForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-send',
      path: '/quotations/sent/form/',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
      components: {
        'app-content': OfferForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-detail',
      path: '/quotations/quotations/detail/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'quotations' }
      },
      components: {
        'app-content': QuotationDetail,
        'app-subnav': SubNav
      },
    },
  ]
}]
