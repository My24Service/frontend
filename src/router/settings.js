import {AUTH_LEVELS, EQUIPMENT_TYPES} from "@/constants";
import Settings from "@/views/company/Settings.vue";
import ImportList from "@/views/company/ImportList.vue";
import ImportForm from "@/views/company/ImportForm.vue";
import ImportPreview from "@/views/company/ImportPreview.vue";
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
import {
  STATUSCODE_TYPE_INVOICE,
  STATUSCODE_TYPE_LEAVE_HOURS,
  STATUSCODE_TYPE_ORDER,
  STATUSCODE_TYPE_QUOTATION, STATUSCODE_TYPE_SICK_LEAVE, STATUSCODE_TYPE_WORK_HOURS
} from "@/models/company/AbstractStatuscode.js";
import StatuscodeList from "@/views/company/statuscode/StatuscodeList.vue";
import StatuscodeForm from "@/views/company/statuscode/StatuscodeForm.vue";
import ActionForm from "@/views/company/statuscode/ActionForm.vue";

const DEFAULT_STATUSCODE_TYPE = STATUSCODE_TYPE_ORDER

function createStatuscodeRoutes(type) {
  return [
    {
      name: `settings-${type}-statuscode-list`,
      path: `${type}`,
      components: {
        'app-content': StatuscodeList,
      },
      props: {
        'app-content': route => ({...route.params, list_type: type}),
      },
    },
    {
      name: `settings-${type}-statuscode-edit`,
      path: `${type}/form/:pk`,
      components: {
        'app-content': StatuscodeForm,
      },
      props: {
        'app-content': { list_type: type },
      },
    },
    {
      name: `settings-${type}-statuscode-add`,
      path: `${type}/form`,
      components: {
        'app-content': StatuscodeForm,
      },
      props: {
        'app-content': { list_type: type },
      },
    },
    {
      name: `settings-${type}-statuscode-action-edit`,
      path: `${type}/action/form/:id`,
      components: {
        'app-content': ActionForm,
      },
      props: {
        'app-content': { list_type: type },
      },
    },
    {
      name: `settings-${type}-statuscode-action-add`,
      path: `${type}/action/form/:statuscode_pk`,
      components: {
        'app-content': ActionForm,
      },
      props: {
        'app-content': { list_type: type },
      },
    },
  ]
}

export default [
  {
    path: '/settings',
    component: TheAppLayoutSettings,
    // Branch employees can reach a few sections below (their own branch, their
    // branch's employee users, equipment and locations). Every other section
    // narrows this back down to PLANNING on its own group.
    meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
    children: [
      {
        path: 'company',
        meta: {
          authLevelNeeded: [AUTH_LEVELS.PLANNING],
          props: {
            route_prefix: 'settings-company-import'
          },
        },
        children: [
          {
            name: 'settings-company',
            path: '',
            components: {
              'app-content': Settings,
            },
          },
          // import
          {
            name: 'settings-company-import-list',
            path: 'import',
            components: {
              'app-content': ImportList,
            },
          },
          {
            name: 'settings-company-import-add',
            path: 'import/form',
            components: {
              'app-content': ImportForm,
            },
          },
          {
            name: 'settings-company-import-edit',
            path: 'import/form/:pk',
            components: {
              'app-content': ImportForm,
            },
          },
          {
            name: 'settings-company-import-preview',
            path: 'import/preview/:pk',
            components: {
              'app-content': ImportPreview,
            },
          },
        ]
      },
      // statuscodes
      {
        path: 'statuscodes',
        meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
        components: {
          'app-content': StatuscodeList,
        },
        props: {
          'app-content': route => ({...route.params, list_type: DEFAULT_STATUSCODE_TYPE}),
        },
        children: [
          ...createStatuscodeRoutes(STATUSCODE_TYPE_ORDER),
          ...createStatuscodeRoutes(STATUSCODE_TYPE_QUOTATION),
          ...createStatuscodeRoutes(STATUSCODE_TYPE_LEAVE_HOURS),
          ...createStatuscodeRoutes(STATUSCODE_TYPE_SICK_LEAVE),
          ...createStatuscodeRoutes(STATUSCODE_TYPE_INVOICE),
          ...createStatuscodeRoutes(STATUSCODE_TYPE_WORK_HOURS),
        ]
      },
      {
        path: 'users',
        meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
        children: [
          // employee users
          // A branch employee may manage the employee users of their own
          // branch; UserEmployeeForm pins the branch to theirs.
          {
            meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
            name: 'settings-users-employees',
            path: 'employee-users',
            components: {
              'app-content': UserEmployeeList,
            },
          },
          {
            meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
            name: 'settings-employee-edit',
            path: 'employee-users/form/:pk',
            components: {
              'app-content': UserEmployeeForm,
            },
          },
          {
            meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
            name: 'settings-employee-add',
            path: 'employee-users/form',
            components: {
              'app-content': UserEmployeeForm,
            },
          },
          // planning users
          {
            name: 'settings-users-planningusers',
            path: 'planning-users',
            components: {
              'app-content': UserPlanningList,
            },
          },
          {
            name: 'settings-planninguser-edit',
            path: 'planning-users/form/:pk',
            components: {
              'app-content': UserPlanningForm,
            },
          },
          {
            name: 'settings-planninguser-add',
            path: 'planning-users/form',
            components: {
              'app-content': UserPlanningForm,
            },
          },
        ]
      },
      // branches
      {
        path: 'branches',
        meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
        children: [
          // Declared before `form/:pk`, otherwise that route swallows
          // /settings/branches/form/my on a direct visit or reload.
          {
            meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
            name: 'settings-my-branch',
            path: 'form/my',
            components: {
              'app-content': BranchForm,
            },
          },
          {
            name: 'settings-branches',
            path: '',
            components: {
              'app-content': BranchList,
            },
          },
          {
            name: 'settings-branch-edit',
            path: 'form/:pk',
            components: {
              'app-content': BranchForm,
            },
          },
          {
            name: 'settings-branch-add',
            path: 'form',
            components: {
              'app-content': BranchForm,
            },
          },
          {
            name: 'settings-branch-view',
            path: ':pk',
            components: {
              'app-content': BranchView,
            },
          },
        ],
      },
      // equipment
      {
        path: 'equipment',
        meta: {
          authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE],
          props: {
            route_prefix: 'settings-equipment'
          },
        },
        children: [
          {
            name: 'settings-equipment-list',
            path: `:type(${Object.values(EQUIPMENT_TYPES).join('|')})`,
            components: {
              'app-content': EquipmentList,
            },
          },
          ...Object.values(EQUIPMENT_TYPES).map((item) => {
            return {
              name: `settings-equipment-view-${item}`,
              path: `${item}/:pk`,
              components: {
                'app-content': EquipmentView,
              },
            }
          }),
          ...Object.values(EQUIPMENT_TYPES).map((item) => {
            return {
              name: `settings-equipment-edit-${item}`,
              path: `${item}/form/:pk`,
              components: {
                'app-content': EquipmentForm,
              },
            }
          }),
          {
            name: 'settings-equipment-add',
            path: 'form',
            components: {
              'app-content': EquipmentForm,
            },
          },
        ],
      },
      //locations
      {
        path: 'locations',
        meta: {
          authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE],
          props: {
            route_prefix: 'settings-location'
          },
        },
        children: [
          {
            name: 'settings-location-list',
            path: '',
            components: {
              'app-content': LocationList,
            },
          },
          {
            name: 'settings-location-edit',
            path: 'form/:pk',
            components: {
              'app-content': LocationForm,
            },
          },
          {
            name: 'settings-location-view',
            path: ':pk',
            components: {
              'app-content': LocationView,
            },
          },
          {
            name: 'settings-location-add',
            path: 'form',
            components: {
              'app-content': LocationForm,
            },
          },
        ],
      },
      // filters
      ...createUserFilterRoutes(
        'settings-order',
        'settings',
        USER_FILTER_TYPE_ORDER,
        true
      ).map((route) => ({
        ...route,
        meta: { ...route.meta, authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      })),
    ]
}]
