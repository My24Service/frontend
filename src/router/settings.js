import {AUTH_LEVELS} from "@/constants";
import Settings from "@/views/company/Settings.vue";
import StatuscodeList from "@/views/shared/StatuscodeList.vue";
import StatuscodeForm from "@/views/shared/StatuscodeForm.vue";
import ActionForm from "@/views/shared/ActionForm.vue";
import {createUserFilterRoutes} from "@/router/helpers";
import {USER_FILTER_TYPE_ORDER} from "@/models/base_user_filter";
import UserEmployeeForm from "@/views/company/UserEmployeeForm.vue";
import UserPlanningList from "@/views/company/UserPlanningList.vue";
import UserPlanningForm from "@/views/company/UserPlanningForm.vue";
import UserEmployeeList from "@/views/company/UserEmployeeList.vue";
import TheAppLayout from "@/components/TheAppLayout.vue";

export default [
  {
    path: '/settings',
    component: TheAppLayout,
    children: [
      {
        name: 'settings-company',
        path: '/settings/company',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE]},
        components: {
          'app-content': Settings,
          'app-subnav': {}
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      // statuscodes
      {
        name: 'settings-statuscode-list',
        path: '/settings/statuscodes',
        components: {
          'app-content': StatuscodeList,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({...route.params, list_type: 'order'}),
          'app-subnav': true
        },
      },
      {
        name: 'settings-statuscode-edit',
        path: '/settings/statuscodes/form/:pk',
        props: {
          'app-content': route => ({...route.params, list_type: 'order'}),
          'app-subnav': true
        },
        components: {
          'app-content': StatuscodeForm,
          'app-subnav': {}
        },
      },
      {
        name: 'settings-statuscode-add',
        path: '/settings/statuscodes/form',
        components: {
          'app-content': StatuscodeForm,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({...route.params, list_type: 'order'}),
          'app-subnav': true
        },
      },
      // actions
      {
        name: 'settings-statuscode-action-edit',
        path: '/settings/statuscodes/action/form/:pk',
        props: {
          'app-content': route => ({...route.params, list_type: 'order'}),
          'app-subnav': true
        },
        components: {
          'app-content': ActionForm,
          'app-subnav': {}
        },
      },
      {
        name: 'settings-statuscode-action-add',
        path: '/settings/statuscodes/action/form-new/:statuscode_pk',
        components: {
          'app-content': ActionForm,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({...route.params, list_type: 'order'}),
          'app-subnav': true
        },
      },
      // employee users
      {
        name: 'settings-users-employees',
        path: '/settings/employee-users',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE]},
        components: {
          'app-content': UserEmployeeList,
          'app-subnav': {}
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'settings-employee-edit',
        path: '/settings/employee-users/form/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE]},
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
        components: {
          'app-content': UserEmployeeForm,
          'app-subnav': {}
        },
      },
      {
        name: 'settings-employee-add',
        path: '/settings/employee-users/form',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE]},
        components: {
          'app-content': UserEmployeeForm,
          'app-subnav': {}
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      // planning users
      {
        name: 'settings-users-planningusers',
        path: '/settings/planning-users',
        components: {
          'app-content': UserPlanningList,
          'app-subnav': {}
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'settings-planninguser-edit',
        path: '/settings/planning-users/form/:pk',
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
        components: {
          'app-content': UserPlanningForm,
          'app-subnav': {}
        },
      },
      {
        name: 'settings-planninguser-add',
        path: '/settings/planning-users/form',
        components: {
          'app-content': UserPlanningForm,
          'app-subnav': {}
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      // filters
      ...createUserFilterRoutes('settings-order', 'settings', USER_FILTER_TYPE_ORDER),
    ]
}]
