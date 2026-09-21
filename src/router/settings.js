import {AUTH_LEVELS, EQUIPMENT_TYPES} from "@/constants";
import { SettingsForm } from '@/features/member';
import { ImportList, ImportForm, ImportPreview } from '@/features/company'
import { BranchList, BranchForm, BranchView } from '@/features/company'
import {createUserFilterRoutes} from "@/router/helpers";
import {USER_FILTER_TYPE} from "@/models/base_user_filter";
import { EmployeeUserForm, EmployeeUserList, PlanningUserForm, PlanningUserList } from '@/features/user';
import TheAppLayout from "@/components/TheAppLayout.vue";
import { EquipmentList } from '@/features/equipment'
import { EquipmentForm } from '@/features/equipment'
import { EquipmentDetail } from '@/features/equipment'
import { LocationList } from '@/features/equipment'
import { LocationForm } from '@/features/equipment'
import { LocationDetail } from '@/features/equipment'
import { ActionForm, CODE_TYPES, StatuscodeForm, StatuscodeList } from '@/features/statuscode';

// The Statuscode Slice (src/features/statuscode/), mounted a second time
// under /settings; fromSettings switches the screens' route names. The
// action "add" route has its own path segment — see router/company.js.
function createStatuscodeRoutes(type) {
  return [
    {
      name: `settings-${type}-statuscode-list`,
      path: `${type}`,
      components: {
        'app-content': StatuscodeList,
      },
      props: {
        'app-content': {codeType: type, fromSettings: true},
      },
    },
    {
      name: `settings-${type}-statuscode-edit`,
      path: `${type}/form/:pk`,
      components: {
        'app-content': StatuscodeForm,
      },
      props: {
        'app-content': route => ({pk: route.params.pk, codeType: type, fromSettings: true}),
      },
    },
    {
      name: `settings-${type}-statuscode-add`,
      path: `${type}/form`,
      components: {
        'app-content': StatuscodeForm,
      },
      props: {
        'app-content': {codeType: type, fromSettings: true},
      },
    },
    {
      name: `settings-${type}-statuscode-action-edit`,
      path: `${type}/action/form/:pk`,
      components: {
        'app-content': ActionForm,
      },
      props: {
        'app-content': route => ({pk: route.params.pk, codeType: type, fromSettings: true}),
      },
    },
    {
      name: `settings-${type}-statuscode-action-add`,
      path: `${type}/action/add/:statuscode_pk`,
      components: {
        'app-content': ActionForm,
      },
      props: {
        'app-content': route => ({statuscodePk: route.params.statuscode_pk, codeType: type, fromSettings: true}),
      },
    },
  ]
}

export default [
  {
    path: '/settings',
    component: TheAppLayout,
    props: { settings: true },
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
              'app-content': SettingsForm,
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
        children: CODE_TYPES.flatMap(createStatuscodeRoutes),
      },
      {
        path: 'users',
        meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
        children: [
          // employee users — converted, #user-slice. Both trees mount the
          // same component; fromSettings switches its add/edit route names.
          // A branch employee may manage the employee users of their own
          // branch; EmployeeUserForm pins the branch to theirs.
          {
            meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
            name: 'settings-users-employees',
            path: 'employee-users',
            components: {
              'app-content': EmployeeUserList,
            },
            props: {
              'app-content': { fromSettings: true },
            },
          },
          {
            meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
            name: 'settings-employee-edit',
            path: 'employee-users/form/:pk',
            props: {
              'app-content': route => ({...route.params}),
            },
            components: {
              'app-content': EmployeeUserForm,
            },
          },
          {
            meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING, AUTH_LEVELS.EMPLOYEE] },
            name: 'settings-employee-add',
            path: 'employee-users/form',
            components: {
              'app-content': EmployeeUserForm,
            },
          },
          // planning users — converted, #user-slice. Both trees mount the
          // same component; fromSettings switches its add/edit route names.
          {
            name: 'settings-users-planningusers',
            path: 'planning-users',
            components: {
              'app-content': PlanningUserList,
            },
            props: {
              'app-content': { fromSettings: true },
            },
          },
          {
            name: 'settings-planninguser-edit',
            path: 'planning-users/form/:pk',
            props: {
              'app-content': route => ({...route.params}),
            },
            components: {
              'app-content': PlanningUserForm,
            },
          },
          {
            name: 'settings-planninguser-add',
            path: 'planning-users/form',
            components: {
              'app-content': PlanningUserForm,
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
          // The untyped pair as well as the typed one. The equipment detail page
          // picks its edit route by product family - the plain name on default,
          // the typed one on shltr - and the location detail page's equipment
          // table links to the plain view. With only the typed pair registered,
          // both were dead on a default tenant.
          {
            name: 'settings-equipment-view',
            path: ':pk',
            components: {
              'app-content': EquipmentDetail,
            },
          },
          {
            name: 'settings-equipment-edit',
            path: 'form/:pk',
            components: {
              'app-content': EquipmentForm,
            },
          },
          ...Object.values(EQUIPMENT_TYPES).map((item) => {
            return {
              name: `settings-equipment-view-${item}`,
              path: `${item}/:pk`,
              components: {
                'app-content': EquipmentDetail,
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
              'app-content': LocationDetail,
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
        USER_FILTER_TYPE.ORDER,
        true
      ).map((route) => ({
        ...route,
        meta: { ...route.meta, authLevelNeeded: [AUTH_LEVELS.PLANNING] },
      })),
    ]
}]
