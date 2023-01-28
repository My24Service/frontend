import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavCompany from '../components/SubNavCompany.vue'

import Dashboard from '../views/company/Dashboard.vue'
import Info from '../views/company/Info.vue'
import Settings from '../views/company/Settings.vue'

import UserEngineerList from '../views/company/UserEngineerList.vue'
import UserEngineerForm from '../views/company/UserEngineerForm.vue'
import UserEngineerDetail from '../views/company/UserEngineerDetail.vue'

import UserSalesList from '../views/company/UserSalesList.vue'
import UserSalesForm from '../views/company/UserSalesForm.vue'

import UserCustomerList from '../views/company/UserCustomerList.vue'
import UserCustomerForm from '../views/company/UserCustomerForm.vue'

import UserPlanningList from '../views/company/UserPlanningList.vue'
import UserPlanningForm from '../views/company/UserPlanningForm.vue'

import UserStudentList from '../views/company/UserStudentList.vue'
import UserStudentForm from '../views/company/UserStudentForm.vue'
import UserStudentDetail from "../views/company/UserStudentDetail"
import UserStudentRegisterVerify from "../views/company/UserStudentRegisterVerify"

import UserApiList from '../views/company/UserApiList.vue'
import UserApiForm from '../views/company/UserApiForm.vue'

import PartnerList from '../views/company/PartnerList.vue'
import PartnerRequestsSentList from '../views/company/PartnerRequestsSentList.vue'
import PartnerRequestsSentForm from '../views/company/PartnerRequestsSentForm.vue'
import PartnerRequestsReceivedList from '../views/company/PartnerRequestsReceivedList.vue'

import ActivityList from '../views/company/ActivityList.vue'

import PictureList from '../views/company/PictureList.vue'
import PictureForm from '../views/company/PictureForm.vue'

import WorkHours from '../views/company/WorkHours.vue'
import WorkHoursDetail from '../views/company/WorkHoursDetail.vue'
import UserStudentRegisterResetPassword from "../views/company/UserStudentRegisterResetPassword";
import SubNavInventory from "../components/SubNavInventory";
import EngineerEventTypeList from "../views/company/EngineerEventTypeList";
import EngineerEventTypeForm from "../views/company/EngineerEventTypeForm";
import EngineerEventList from "../views/company/EngineerEventList";
import {AUTH_LEVELS} from "../constants";


export default [
{
  path: '/company',
  component: TheAppLayout,
  children: [
      {
        name: 'company-dashboard',
        path: '/company/dashboard',
        components: {
          'app-content': Dashboard,
          'app-subnav': SubNavCompany
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
    {
      name: 'company-info',
      path: '/company/company/info',
      components: {
        'app-content': Info,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-settings',
      path: '/company/company/settings',
      components: {
        'app-content': Settings,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // users
    {
      name: 'users-engineers',
      path: '/company/engineer-users',
      components: {
        'app-content': UserEngineerList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'engineer-detail',
      path: '/company/engineer-users/detail/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserEngineerDetail,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'engineer-edit',
      path: '/company/engineer-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserEngineerForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'engineer-add',
      path: '/company/engineer-users/form',
      components: {
        'app-content': UserEngineerForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // engineer events
    {
      name: 'engineer-event-list',
      path: '/company/engineer-users/events',
      components: {
        'app-content': EngineerEventList,
        'app-subnav': SubNavInventory
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },

    // engineer event types
    {
      name: 'engineer-event-type-list',
      path: '/company/engineer-users/event-types',
      components: {
        'app-content': EngineerEventTypeList,
        'app-subnav': SubNavInventory
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'engineer-event-type-edit',
      path: '/company/engineer-users/event-types/form/:pk',
      components: {
        'app-content': EngineerEventTypeForm,
        'app-subnav': SubNavInventory
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
    },
    {
      name: 'engineer-event-type-add',
      path: '/company/engineer-users/event-types/form',
      components: {
        'app-content': EngineerEventTypeForm,
        'app-subnav': SubNavInventory
      },
      props: {
        'app-content': {},
        'app-subnav': true
      },
    },
    {
      name: 'users-salesusers',
      path: '/company/sales-users',
      components: {
        'app-content': UserSalesList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'salesuser-edit',
      path: '/company/sales-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserSalesForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'salesuser-add',
      path: '/company/sales-users/form',
      components: {
        'app-content': UserSalesForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'users-customerusers',
      path: '/company/customer-users',
      components: {
        'app-content': UserCustomerList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'customeruser-edit',
      path: '/company/customer-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserCustomerForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'customeruser-add',
      path: '/company/customer-users/form',
      components: {
        'app-content': UserCustomerForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // planning users
    {
      name: 'users-planningusers',
      path: '/company/planning-users',
      components: {
        'app-content': UserPlanningList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'planninguser-edit',
      path: '/company/planning-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserPlanningForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'planninguser-add',
      path: '/company/planning-users/form',
      components: {
        'app-content': UserPlanningForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // API
    {
      name: 'users-apiusers',
      path: '/company/api-users',
      components: {
        'app-content': UserApiList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'apiuser-add',
      path: '/company/api-users/form',
      components: {
        'app-content': UserApiForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'apiuser-edit',
      path: '/company/api-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserApiForm,
        'app-subnav': SubNavCompany
      },
    },
    // students
    {
      name: 'users-studentusers',
      path: '/company/student-users',
      components: {
        'app-content': UserStudentList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'studentuser-add',
      path: '/company/student-users/form',
      components: {
        'app-content': UserStudentForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'studentuser-edit',
      path: '/company/student-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserStudentForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'studentuser-detail',
      path: '/company/student-users/view/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserStudentDetail,
        'app-subnav': SubNavCompany
      },
    },
    // registration
    {
      meta: { needsAuth: false },
      name: 'studentuser-register',
      path: '/company/student-users/register',
      components: {
        'app-content': UserStudentForm,
      },
      props: {
        'app-content': route => ({mode: 'register', ...route.params}),
      },
    },
    {
      meta: { needsAuth: false },
      name: 'studentuser-verify',
      path: '/company/student-users/register/verify',
      components: {
        'app-content': UserStudentRegisterVerify,
      },
      props: {
        'app-content': {},
      },
    },
    {
      meta: { needsAuth: false },
      name: 'studentuser-reset-password',
      path: '/company/student-users/register/reset-password',
      components: {
        'app-content': UserStudentRegisterResetPassword,
      },
      props: {
        'app-content': {},
      },
    },
    // partners
    {
      name: 'company-partners-active',
      path: '/company/partners/active',
      components: {
        'app-content': PartnerList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-partners-requests-sent',
      path: '/company/partners/requests-sent',
      components: {
        'app-content': PartnerRequestsSentList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'partner-request-add',
      path: '/company/partners/requests/form',
      components: {
        'app-content': PartnerRequestsSentForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-partners-requests-received',
      path: '/company/partners/requests-received',
      components: {
        'app-content': PartnerRequestsReceivedList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // activity
    {
      name: 'company-activity',
      path: '/company/activity',
      components: {
        'app-content': ActivityList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // pictures
    {
      name: 'company-pictures',
      path: '/company/pictures',
      components: {
        'app-content': PictureList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-picture-edit',
      path: '/company/pictures/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': PictureForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'company-picture-add',
      path: '/company/pictures/form',
      components: {
        'app-content': PictureForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-workhours',
      path: '/company/workhours',
      components: {
        'app-content': WorkHours,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-workhours-detail',
      path: '/company/workhours/:user_id/:submodel_id',
      components: {
        'app-content': WorkHoursDetail,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },

  ]
}]
