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
import TheAppLayoutSettings from "@/components/TheAppLayoutSettings.vue";
import BranchList from "@/views/company/BranchList.vue";
import BranchForm from "@/views/company/BranchForm.vue";
import BranchView from "@/views/company/BranchView.vue";
import EquipmentList from "@/views/equipment/EquipmentList.vue";
import EquipmentForm from "@/views/equipment/EquipmentForm.vue";
import EquipmentView from "@/views/equipment/EquipmentView.vue";
import LocationList from "@/views/equipment/LocationList.vue";
import LocationForm from "@/views/equipment/LocationForm.vue";
import LocationView from "@/views/equipment/LocationView.vue";

export default [
  {
    path: '/settings',
    component: TheAppLayoutSettings,
    props: {settings: true},
    children: [
      {
        name: 'settings-company',
        path: '/settings/company',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
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
        name: 'settings-order-statuscode-list',
        path: '/settings/statuscodes',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': StatuscodeList,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({
            ...route.params,
            list_type: 'order',
            from_settings: true
          }),
          'app-subnav': {}
        },
      },
      {
        name: 'settings-order-statuscode-edit',
        path: '/settings/statuscodes/form/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        props: {
          'app-content': route => ({
            ...route.params,
            list_type: 'order',
            from_settings: true
          }),
          'app-subnav': {}
        },
        components: {
          'app-content': StatuscodeForm,
          'app-subnav': {}
        },
      },
      {
        name: 'settings-order-statuscode-add',
        path: '/settings/statuscodes/form',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': StatuscodeForm,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({
            ...route.params,
            list_type: 'order',
            from_settings: true
          }),
          'app-subnav': true
        },
      },
      // actions
      {
        name: 'settings-statuscode-action-edit',
        path: '/settings/statuscodes/action/form/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
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
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
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
        path: '/settings/users/employee-users',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': UserEmployeeList,
          'app-subnav': {}
        },
        props: {
          'app-content': {from_settings: true},
          'app-subnav': {}
        },
      },
      {
        name: 'settings-employee-edit',
        path: '/settings/users/employee-users/form/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
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
        path: '/settings/users/employee-users/form',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
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
        path: '/settings/users/planning-users',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': UserPlanningList,
          'app-subnav': {}
        },
        props: {
          'app-content': {from_settings: true},
          'app-subnav': {}
        },
      },
      {
        name: 'settings-planninguser-edit',
        path: '/settings/users/planning-users/form/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
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
        path: '/settings/users/planning-users/form',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': UserPlanningForm,
          'app-subnav': {}
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      // branches
      {
        name: 'settings-branches',
        path: '/settings/branches',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': BranchList,
          'app-subnav': {}
        },
        props: {
          'app-content': {from_settings: true},
          'app-subnav': {}
        },
      },
      {
        name: 'settings-branch-edit',
        path: '/settings/branches/form/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': BranchForm,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        name: 'settings-branch-add',
        path: '/settings/branches/form',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': BranchForm,
          'app-subnav': {}
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        name: 'settings-branch-view',
        path: '/settings/branches/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': BranchView,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({...route.params, from_settings: true}),
          'app-subnav': {}
        },
      },
      {
        meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
        name: 'settings-my-branch',
        path: '/settings/branches/form/my',
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
        components: {
          'app-content': BranchForm,
          'app-subnav': {}
        },
      },
      // equipment
      {
        name: 'settings-equipment-list',
        path: '/settings/equipment/:type(technical|facility)',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': EquipmentList,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({
            from_settings: true,
            ...route.params,
          }),
          'app-subnav': {}
        },
      },
      {
        name: 'settings-equipment-edit',
        path: '/settings/equipment/form/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': EquipmentForm,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({
            ...route.params,
            from_settings: true
          }),
          'app-subnav': {}
        },
      },
      {
        name: 'settings-equipment-view',
        path: '/settings/equipment/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': EquipmentView,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({
            ...route.params,
            from_settings: true
          }),
          'app-subnav': {}
        },
      },
      {
        name: 'settings-equipment-add',
        path: '/settings/equipment/form',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': EquipmentForm,
          'app-subnav': {}
        },
        props: {
          'app-content': {from_settings: true},
          'app-subnav': {}
        },
      },
      //locations
      {
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        name: 'settings-location-list',
        path: '/settings/locations',
        components: {
          'app-content': LocationList,
          'app-subnav': {}
        },
        props: {
          'app-content': {from_settings: true},
          'app-subnav': {}
        },
      },
      {
        name: 'settings-location-edit',
        path: '/settings/locations/form/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': LocationForm,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({
            ...route.params,
            from_settings: true
          }),
          'app-subnav': {}
        },
      },
      {
        name: 'settings-location-view',
        path: '/settings/locations/:pk',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': LocationView,
          'app-subnav': {}
        },
        props: {
          'app-content': route => ({
            ...route.params,
            from_settings: true
          }),
          'app-subnav': {}
        },
      },
      {
        name: 'settings-location-add',
        path: '/settings/locations/form',
        meta: {authLevelNeeded: [AUTH_LEVELS.PLANNING]},
        components: {
          'app-content': LocationForm,
          'app-subnav': {}
        },
        props: {
          'app-content': {from_settings: true},
          'app-subnav': {}
        },
      },
      // filters
      ...createUserFilterRoutes(
        'settings-order',
        'settings',
        USER_FILTER_TYPE_ORDER,
        true
      ),
    ]
}]
