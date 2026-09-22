import TheAppLayout from '../components/TheAppLayout.vue'
import SubNav from '../components/SubNav.vue'

import CompanyDashboard from '../views/company/CompanyDashboard.vue'
import {
  CompanyInfo,
  PartnerList,
  PartnerRequestsSentList,
  PartnerRequestsSentForm,
  PartnerRequestsReceivedList,
  ActivityList,
  PictureList,
  PictureForm,
  BranchList,
  BranchForm,
  BranchView,
  BudgetList,
  BudgetView,
  TemplateList,
  TemplateForm,
  ImportList,
  ImportForm,
  ImportPreview,
} from '@/features/company'
import { SettingsForm } from '@/features/member'

// The user screens live in the feature folder; this file only routes them
// (ADR-0002). The student registration's set-password step is the account
// slice's reset-password screen, reached through the link the backend mails.
import { ApiUserForm, ApiUserList, CustomerUserForm, CustomerUserList, EmployeeUserForm, EmployeeUserList, EngineerUserForm, EngineerUserList, PlanningUserForm, PlanningUserList, SalesUserForm, SalesUserList, StudentRegisterForm, StudentRegisterVerify, StudentUserDetail, StudentUserForm, StudentUserList } from '@/features/user'
import { ResetPasswordConfirmView } from '@/features/account'




// The engineer-event screens (the events list, its event types and the event
// type form) live in the field-service feature folder; this file only routes
// them (ADR-0002). The attach-order modal the list mounts comes with it.
import { EngineerEventList, EngineerEventTypeForm, EngineerEventTypeList } from '@/features/field-service'

import {AUTH_LEVELS} from "../constants";



// The workforce screens (time registration, leave, sick leave) live in the
// feature folder; this file only routes them (ADR-0002). The backend split them
// into apps/workforce and the frontend mirrors that split.
import { LeaveForm, LeaveList, LeaveRequestsList, LeaveTypes, SickLeaveForm, SickLeaveList, TimeRegistration, UnconfirmedSickLeaveList } from '@/features/workforce'


import { ActionForm, CODE_TYPES, StatuscodeForm, StatuscodeList } from '@/features/statuscode';


import GrippSettings from "../views/company/ConnectorGrippSettings.vue";

import TeamleaderSettings from "@/views/company/TeamleaderSettings.vue";
import TeamleaderCallback from "@/views/company/TeamleaderCallback.vue";
import ComingSoon from "@/views/shared/ComingSoon.vue";

const DEFAULT_STATUSCODE_TYPE = 'order'

// The Statuscode Slice (src/features/statuscode/). One set of routes per
// code type; the screens take the type as a prop. The action "add" route has
// its own path segment: it used to share `form/:param` with "edit", so a
// reload of one resolved as the other.
function createStatuscodeRoutes(type) {
  return [
    {
      name: `company-statuscodes-${type}`,
      path: `/company/statuscodes/${type}`,
      components: {
        'app-content': StatuscodeList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {codeType: type},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: `company-statuscodes-${type}-add`,
      path: `/company/statuscodes/${type}/form`,
      components: {
        'app-content': StatuscodeForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {codeType: type},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: `company-statuscodes-${type}-edit`,
      path: `/company/statuscodes/${type}/form/:pk`,
      components: {
        'app-content': StatuscodeForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({pk: route.params.pk, codeType: type}),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: `company-statuscodes-action-${type}-add`,
      path: `/company/statuscodes/action/${type}/add/:statuscode_pk`,
      components: {
        'app-content': ActionForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({statuscodePk: route.params.statuscode_pk, codeType: type}),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: `company-statuscodes-action-${type}-edit`,
      path: `/company/statuscodes/action/${type}/form/:pk`,
      props: {
        'app-content': route => ({pk: route.params.pk, codeType: type}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': ActionForm,
        'app-subnav': SubNav
      },
    },
  ]
}

export default [
{
  path: '/company',
  component: TheAppLayout,
  children: [
    {
      meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
      name: 'employee-dashboard',
      path: '/company/employee-dashboard',
      components: {
        'app-content': BranchView,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-dashboard',
      path: '/company/dashboard',
      components: {
        'app-content': CompanyDashboard,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-info',
      path: '/company/company/info',
      components: {
        'app-content': CompanyInfo,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-settings',
      path: '/company/company/settings',
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
      components: {
        'app-content': SettingsForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // engineer users — converted, #user-slice
    {
      name: 'users-engineers',
      path: '/company/engineer-users',
      components: {
        'app-content': EngineerUserList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'engineer-edit',
      path: '/company/engineer-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': EngineerUserForm,
        'app-subnav': SubNav
      },
    },
    {
      // The list's add link is gated on isStaff || isSuperuser; without this
      // meta the route falls through to the guard's planning default and a
      // planning user could open a form the list hides.
      meta: {authLevelNeeded: AUTH_LEVELS.STAFF},
      name: 'engineer-add',
      path: '/company/engineer-users/form',
      components: {
        'app-content': EngineerUserForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // engineer events
    {
      name: 'engineer-event-list',
      path: '/company/engineer-users/events',
      components: {
        'app-content': EngineerEventList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'inventory' }
      },
    },

    // engineer event types
    {
      name: 'engineer-event-type-list',
      path: '/company/engineer-users/event-types',
      components: {
        'app-content': EngineerEventTypeList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'inventory' }
      },
    },
    {
      name: 'engineer-event-type-edit',
      path: '/company/engineer-users/event-types/form/:pk',
      components: {
        'app-content': EngineerEventTypeForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'inventory' }
      },
    },
    {
      name: 'engineer-event-type-add',
      path: '/company/engineer-users/event-types/form',
      components: {
        'app-content': EngineerEventTypeForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'inventory' }
      },
    },
    // sales users — converted, #user-slice
    {
      name: 'users-salesusers',
      path: '/company/sales-users',
      components: {
        'app-content': SalesUserList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'salesuser-edit',
      path: '/company/sales-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': SalesUserForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'salesuser-add',
      path: '/company/sales-users/form',
      components: {
        'app-content': SalesUserForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // customer users — converted, #user-slice
    {
      name: 'users-customerusers',
      path: '/company/customer-users',
      components: {
        'app-content': CustomerUserList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'customeruser-edit',
      path: '/company/customer-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': CustomerUserForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'customeruser-add',
      path: '/company/customer-users/form',
      components: {
        'app-content': CustomerUserForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // planning users — converted, #user-slice
    {
      name: 'users-planningusers',
      path: '/company/planning-users',
      components: {
        'app-content': PlanningUserList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'planninguser-edit',
      path: '/company/planning-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': PlanningUserForm,
        'app-subnav': SubNav
      },
    },
    {
      name: 'planninguser-add',
      path: '/company/planning-users/form',
      components: {
        'app-content': PlanningUserForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // API users — converted, #user-slice
    {
      name: 'users-apiusers',
      path: '/company/api-users',
      components: {
        'app-content': ApiUserList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      // Same as engineer-add: the button says staff or superuser, so the
      // route says so too instead of falling through to planning.
      meta: {authLevelNeeded: AUTH_LEVELS.STAFF},
      name: 'apiuser-add',
      path: '/company/api-users/form',
      components: {
        'app-content': ApiUserForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'apiuser-edit',
      path: '/company/api-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': ApiUserForm,
        'app-subnav': SubNav
      },
    },
    // employee users — converted, #user-slice
    {
      name: 'users-employees',
      path: '/company/employee-users',
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
      components: {
        'app-content': EmployeeUserList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'employee-edit',
      path: '/company/employee-users/form/:pk',
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': EmployeeUserForm,
        'app-subnav': SubNav
      },
    },
    {
      name: 'employee-add',
      path: '/company/employee-users/form',
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
      components: {
        'app-content': EmployeeUserForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // student users
    {
      name: 'users-studentusers',
      path: '/company/student-users',
      components: {
        'app-content': StudentUserList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'studentuser-add',
      path: '/company/student-users/form',
      components: {
        'app-content': StudentUserForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'studentuser-edit',
      path: '/company/student-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': StudentUserForm,
        'app-subnav': SubNav
      },
    },
    {
      name: 'studentuser-detail',
      path: '/company/student-users/view/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': StudentUserDetail,
        'app-subnav': SubNav
      },
    },
    // registration
    {
      meta: { needsAuth: false },
      name: 'studentuser-register',
      path: '/company/student-users/register',
      components: {
        'app-content': StudentRegisterForm,
      },
      props: {
        'app-content': {},
      },
    },
    {
      meta: { needsAuth: false },
      name: 'studentuser-verify',
      path: '/company/student-users/register/verify',
      components: {
        'app-content': StudentRegisterVerify,
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
        'app-content': ResetPasswordConfirmView,
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
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-partners-requests-sent',
      path: '/company/partners/requests-sent',
      components: {
        'app-content': PartnerRequestsSentList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'partner-request-add',
      path: '/company/partners/requests/form',
      components: {
        'app-content': PartnerRequestsSentForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-partners-requests-received',
      path: '/company/partners/requests-received',
      components: {
        'app-content': PartnerRequestsReceivedList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // activity
    {
      name: 'company-activity',
      path: '/company/activity',
      components: {
        'app-content': ActivityList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // pictures
    {
      name: 'company-pictures',
      path: '/company/pictures',
      components: {
        'app-content': PictureList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-picture-edit',
      path: '/company/pictures/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': PictureForm,
        'app-subnav': SubNav
      },
    },
    {
      name: 'company-picture-add',
      path: '/company/pictures/form',
      components: {
        'app-content': PictureForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // time registration
    {
      name: 'company-time-registration',
      path: '/company/time-registration',
      components: {
        'app-content': TimeRegistration,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-time-registration-detail',
      path: '/company/time-registration/detail/:user_id',
      components: {
        'app-content': TimeRegistration,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
    },
    // branches
    {

      name: 'company-branches',
      path: '/company/branches',
      components: {
        'app-content': BranchList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    // Declared before `form/:pk`, otherwise that route swallows
    // /company/branches/form/my on a direct visit or reload, and the branch
    // employee loses the auth level below.
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
      name: 'company-my-branch',
      path: '/company/branches/form/my',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': BranchForm,
        'app-subnav': SubNav
      },
    },
    {
      name: 'company-branch-edit',
      path: '/company/branches/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': BranchForm,
        'app-subnav': SubNav
      },
    },
    {
      name: 'company-branch-add',
      path: '/company/branches/form',
      components: {
        'app-content': BranchForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-branch-view',
      path: '/company/branches/:pk',
      components: {
        'app-content': BranchView,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
    },
    // budgets
    {
      name: 'company-budgets',
      path: '/company/budgets',
      components: {
        'app-content': BudgetList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'company-budget-view',
      path: '/company/budgets/:pk',
      components: {
        'app-content': BudgetView,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
    },
    {
      meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
      path: '/company/budgets/my',
      name: 'company-my-budgets',
      components: {
        'app-content': ComingSoon,
        'app-subnav': SubNav
      },
      props: {
        'app-subnav': { section: 'company' },
      },
    },
    // statuscodes
    {
      name: 'company-statuscodes',
      path: `/company/statuscodes`,
      components: {
        'app-content': StatuscodeList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {codeType: DEFAULT_STATUSCODE_TYPE},
        'app-subnav': { section: 'company' }
      },
    },
    ...CODE_TYPES.flatMap(createStatuscodeRoutes),
    // templates
    {
      name: 'company-templates',
      path: '/company/templates',
      components: {
        'app-content': TemplateList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'customer-template-add',
      path: '/company/templates/form',
      components: {
        'app-content': TemplateForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'customer-template-edit',
      path: '/company/templates/form/:pk',
      components: {
        'app-content': TemplateForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'leave-requests',
      path: '/company/time-registration/leave/requests',
      components: {
        'app-content': LeaveRequestsList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'leave-list',
      path: '/company/time-registration/leave',
      components: {
        'app-content': LeaveList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'leave-list-add',
      path: '/company/time-registration/leave/form',
      components: {
        'app-content': LeaveForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'leave-edit',
      path: '/company/time-registration/leave/form/:pk',
      components: {
        'app-content': LeaveForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'leave-types',
      path: '/company/time-registration/leave/types',
      components: {
        'app-content': LeaveTypes,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'unconfirmed-sick-leave',
      path: '/company/time-registration/sick-leave/unconfirmed',
      components: {
        'app-content': UnconfirmedSickLeaveList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'sick-leave-list',
      path: '/company/time-registration/sick-leave',
      components: {
        'app-content': SickLeaveList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'sick-leave-list-add',
      path: '/company/time-registration/sick-leave/form',
      components: {
        'app-content': SickLeaveForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },
    {
      name: 'sick-leave-list-edit',
      path: '/company/time-registration/sick-leave/form/:pk',
      components: {
        'app-content': SickLeaveForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': { section: 'company' }
      },
    },

    // import
    {
      path: '/company/import',
      meta: {
        props: {
          route_prefix: 'company-import',
        },
      },
      children: [
        {
          name: 'company-import-list',
          path: '',
          components: {
            'app-content': ImportList,
            'app-subnav': SubNav
          },
          props: {
            'app-content': route => ({...route.params}),
            'app-subnav': { section: 'company' }
          },
        },
        {
          name: 'company-import-add',
          path: 'form',
          components: {
            'app-content': ImportForm,
            'app-subnav': SubNav
          },
          props: {
            'app-content': route => ({...route.params}),
            'app-subnav': { section: 'company' }
          },
        },
        {
          name: 'company-import-edit',
          path: 'form/:pk',
          components: {
            'app-content': ImportForm,
            'app-subnav': SubNav
          },
          props: {
            'app-content': route => ({...route.params}),
            'app-subnav': { section: 'company' }
          },
        },
        {
          name: 'company-import-preview',
          path: 'preview/:pk',
          components: {
            'app-content': ImportPreview,
            'app-subnav': SubNav
          },
          props: {
            'app-content': route => ({...route.params}),
            'app-subnav': { section: 'company' }
          },
        },
      ],
    },
    // Gripp settings
    {
      name: 'company-connector-gripp',
      path: '/company/connector-gripp',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': GrippSettings,
        'app-subnav': SubNav
      },
    },
    // Teamleader
    {
      name: 'company-teamleader-settings',
      path: '/company/teamleader/settings',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': TeamleaderSettings,
        'app-subnav': SubNav
      },
    },
    {
      name: 'company-teamleader-callback',
      path: '/company/teamleader/callback',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'company' }
      },
      components: {
        'app-content': TeamleaderCallback,
        'app-subnav': SubNav
      },
    },
  ]
}]
