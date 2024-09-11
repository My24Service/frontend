import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavQuotations from '../components/SubNavQuotations.vue'

import QuotationList from '../views/quotations/QuotationList.vue'
import QuotationForm from '../views/quotations/QuotationForm.vue'
import {AUTH_LEVELS} from "@/constants";
import TheAppLayoutEmpty from "@/components/TheAppLayoutEmpty.vue";
import QuotationView from "@/views/quotations/QuotationView.vue";
import QuotationDetail from "@/views/quotations/QuotationDetail.vue";
import OfferForm from "@/views/quotations/OfferForm.vue";

export default [
// orders
{
  component: TheAppLayoutEmpty,
  path: '/quotations',
  children: [
    {
      name: 'quotation-view',
      path: '/quotations/quotations/view/:pk',
      components: {
        'app-content': QuotationView,
      },
      props: {
        'app-content': route => ({...route.params})
      },
    },
  ]
},
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
        'app-subnav': SubNavQuotations
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'preliminary-quotations',
      path: '/quotations/preliminary',
      components: {
        'app-content': QuotationList,
        'app-subnav': SubNavQuotations
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotations-sent',
      path: '/quotations/sent',
      components: {
        'app-content': QuotationList,
        'app-subnav': SubNavQuotations
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-add',
      path: '/quotations/preliminary/form',
      components: {
        'app-content': QuotationForm,
        'app-subnav': SubNavQuotations
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
	  },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-edit',
      path: '/quotations/quotations/form/:pk(\\d+)',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': QuotationForm,
        'app-subnav': SubNavQuotations
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-edit-preliminary',
      path: '/quotations/preliminary/form/:pk(\\d+)',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': QuotationForm,
        'app-subnav': SubNavQuotations
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-send',
      path: '/quotations/sent/form/',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': OfferForm,
        'app-subnav': SubNavQuotations
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      name: 'quotation-detail',
      path: '/quotations/quotations/detail/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
      components: {
        'app-content': QuotationDetail,
        'app-subnav': SubNavQuotations
      },
    },
  ]
}]
