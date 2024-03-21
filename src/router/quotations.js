import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavQuotations from '../components/SubNavQuotations.vue'

import QuotationList from '../views/quotations/QuotationList.vue'
import QuotationForm from '../views/quotations/QuotationForm.vue'
import {AUTH_LEVELS} from "@/constants";
import TheAppLayoutEmpty from "@/components/TheAppLayoutEmpty.vue";
import QuotationView from "@/views/quotations/QuotationView.vue";
import QuotationDetail from "@/views/quotations/QuotationDetail.vue";


export default [
// orders
{
  component: TheAppLayoutEmpty,
  path: '/quotations',
  children: [
    {
      meta: { needsAuth: false },
      name: 'quotation-view',
      path: '/quotations/quotation/view/:uuid',
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
      name: 'quotation-add',
      path: '/quotations/quotations/form',
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
      name: 'quotation-detail',
      path: '/quotations/quotations/detail/:uuid',
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
