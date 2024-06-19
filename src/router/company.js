import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavCompany from '../components/SubNavCompany.vue'

import Dashboard from '../views/company/Dashboard.vue'
import Info from '../views/company/Info.vue'
import Settings from '../views/company/Settings.vue'

import UserEngineerList from '../views/company/UserEngineerList.vue'
import UserEngineerForm from '../views/company/UserEngineerForm.vue'

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

import UserStudentRegisterResetPassword from "../views/company/UserStudentRegisterResetPassword";

import SubNavInventory from "../components/SubNavInventory";

import EngineerEventTypeList from "../views/company/EngineerEventTypeList";
import EngineerEventTypeForm from "../views/company/EngineerEventTypeForm";
import EngineerEventList from "../views/company/EngineerEventList";

import {AUTH_LEVELS} from "../constants";

import UserEmployeeList from "../views/company/UserEmployeeList";
import UserEmployeeForm from "../views/company/UserEmployeeForm";

import BranchList from "../views/company/BranchList";
import BranchForm from "../views/company/BranchForm";

import TimeRegistration from '../views/company/time-registration/TimeRegistration.vue'
import BranchView from "../views/company/BranchView";

import BudgetList from "../views/company/BudgetList";
import BudgetView from "../views/company/BudgetView";

import StatuscodeList from "../views/company/statuscode/StatuscodeList";
import StatuscodeForm from "../views/company/statuscode/StatuscodeForm";
import ActionForm from "../views/company/statuscode/ActionForm";

import TemplateList from "../views/company/template/TemplateList";
import TemplateForm from "../views/company/template/TemplateForm";

import LeaveRequestsList from "../views/company/time-registration/LeaveRequestsList";
import LeaveList from "../views/company/time-registration/LeaveList";
import LeaveForm from "../views/company/time-registration/LeaveForm";
import LeaveTypes from "../views/company/time-registration/LeaveTypes";
import UnconfirmedSickLeaveList from "../views/company/time-registration/UnconfirmedSickLeaveList";
import SickLeaveList from "../views/company/time-registration/SickLeaveList";
import SickLeaveForm from "../views/company/time-registration/SickLeaveForm";

import {
  STATUSCODE_TYPE_LEAVE_HOURS,
  STATUSCODE_TYPE_QUOTATION, STATUSCODE_TYPE_SICK_LEAVE
} from "../models/company/AbstractStatuscode";
import ImportList from "../views/company/ImportList";

import ImportForm from "../views/company/ImportForm";
import ImportPreview from "../views/company/ImportPreview";

const DEFAULT_STATUSCODE_TYPE = STATUSCODE_TYPE_LEAVE_HOURS

function createStatuscodeRoutes(type) {
  return [
    {
      name: `company-statuscodes-${type}`,
      path: `/company/statuscodes/${type}`,
      components: {
        'app-content': StatuscodeList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params, list_type: type}),
        'app-subnav': true
      },
    },
    {
      name: `company-statuscodes-${type}-add`,
      path: `/company/statuscodes/${type}/form`,
      components: {
        'app-content': StatuscodeForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params, list_type: type}),
        'app-subnav': true
      },
    },
    {
      name: `company-statuscodes-${type}-edit`,
      path: `/company/statuscodes/${type}/form/:pk`,
      components: {
        'app-content': StatuscodeForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params, list_type: type}),
        'app-subnav': true
      },
    },
    {
      name: `company-statuscodes-action-${type}-add`,
      path: `/company/statuscodes/action/${type}/form`,
      components: {
        'app-content': ActionForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params, list_type: type}),
        'app-subnav': true
      },
    },
    {
      name: `company-statuscodes-action-${type}-edit`,
      path: `/company/statuscodes/action/${type}/form/:pk`,
      props: {
        'app-content': route => ({...route.params, list_type: type}),
        'app-subnav': true
      },
      components: {
        'app-content': ActionForm,
        'app-subnav': SubNavCompany
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
        // 'app-subnav': {}
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
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
    // sales users
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
    // customer users
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
    // employee users
    {
      name: 'users-employees',
      path: '/company/employee-users',
      components: {
        'app-content': UserEmployeeList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'employee-edit',
      path: '/company/employee-users/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserEmployeeForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'employee-add',
      path: '/company/employee-users/form',
      components: {
        'app-content': UserEmployeeForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
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
    // time registration
    {
      name: 'company-time-registration',
      path: '/company/time-registration',
      components: {
        'app-content': TimeRegistration,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-time-registration-detail',
      path: '/company/time-registration/detail/:user_id',
      components: {
        'app-content': TimeRegistration,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    // branches
    {
      name: 'company-branches',
      path: '/company/branches',
      components: {
        'app-content': BranchList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-branch-edit',
      path: '/company/branches/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': BranchForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'company-branch-add',
      path: '/company/branches/form',
      components: {
        'app-content': BranchForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-branch-view',
      path: '/company/branches/:pk',
      components: {
        'app-content': BranchView,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
    },
    // budgets
    {
      name: 'company-budgets',
      path: '/company/budgets',
      components: {
        'app-content': BudgetList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-budget-view',
      path: '/company/budgets/:pk',
      components: {
        'app-content': BudgetView,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
    },
    // statuscodes
    {
      name: 'company-statuscodes',
      path: `/company/statuscodes`,
      components: {
        'app-content': StatuscodeList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params, list_type: DEFAULT_STATUSCODE_TYPE}),
        'app-subnav': true
      },
    },
    ...createStatuscodeRoutes(STATUSCODE_TYPE_QUOTATION),
    ...createStatuscodeRoutes(STATUSCODE_TYPE_LEAVE_HOURS),
    ...createStatuscodeRoutes(STATUSCODE_TYPE_SICK_LEAVE),
    // templates
    {
      name: 'company-templates',
      path: '/company/templates',
      components: {
        'app-content': TemplateList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'customer-template-add',
      path: '/company/templates/form',
      components: {
        'app-content': TemplateForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': true
      },
    },
    {
      name: 'customer-template-edit',
      path: '/company/templates/form/:pk',
      components: {
        'app-content': TemplateForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': true
      },
    },
    {
      name: 'leave-requests',
      path: '/company/time-registration/leave/requests',
      components: {
        'app-content': LeaveRequestsList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': {}
      },
    },
    {
      name: 'leave-list',
      path: '/company/time-registration/leave',
      components: {
        'app-content': LeaveList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': {}
      },
    },
    {
      name: 'leave-list-add',
      path: '/company/time-registration/leave/form',
      components: {
        'app-content': LeaveForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': true
      },
    },
    {
      name: 'leave-edit',
      path: '/company/time-registration/leave/form/:pk',
      components: {
        'app-content': LeaveForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': true
      },
    },
    {
      name: 'leave-types',
      path: '/company/time-registration/leave/types',
      components: {
        'app-content': LeaveTypes,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': {}
      },
    },
    {
      name: 'unconfirmed-sick-leave',
      path: '/company/time-registration/sick-leave/unconfirmed',
      components: {
        'app-content': UnconfirmedSickLeaveList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': {}
      },
    },
    {
      name: 'sick-leave-list',
      path: '/company/time-registration/sick-leave',
      components: {
        'app-content': SickLeaveList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': {}
      },
    },
    {
      name: 'sick-leave-list-add',
      path: '/company/time-registration/sick-leave/form',
      components: {
        'app-content': SickLeaveForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': true
      },
    },
    {
      name: 'sick-leave-list-edit',
      path: '/company/time-registration/sick-leave/form/:pk',
      components: {
        'app-content': SickLeaveForm,
        'app-subnav':  SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params }),
        'app-subnav': true
      },
    },

    // import
    {
      name: 'company-import-list',
      path: '/company/import',
      components: {
        'app-content': ImportList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'company-import-add',
      path: '/company/import/form',
      components: {
        'app-content': ImportForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'company-import-edit',
      path: '/company/import/form/:pk',
      components: {
        'app-content': ImportForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
    {
      name: 'company-import-preview',
      path: '/company/import/preview/:pk',
      components: {
        'app-content': ImportPreview,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': true
      },
    },
  ]
}]
