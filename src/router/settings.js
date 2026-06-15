import {AUTH_LEVELS, EQUIPMENT_TYPES} from "@/constants";
import Settings from "@/views/company/Settings.vue";
import ImportList from "@/views/company/ImportList.vue";
import ImportForm from "@/views/company/ImportForm.vue";
import ImportPreview from "@/views/company/ImportPreview.vue";
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
    meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
    children: [
      {
        path: 'company',
        meta: {
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
        children: [
          {
            name: 'settings-order-statuscode-list',
            path: '',
            components: {
              'app-content': StatuscodeList,
            },
          },
          {
            name: 'settings-order-statuscode-edit',
            path: 'form/:pk',
            props: {
              'app-content': { list_type: 'order' },
            },
            components: {
              'app-content': StatuscodeForm,
            },
          },
          {
            name: 'settings-order-statuscode-add',
            path: 'form',
            components: {
              'app-content': StatuscodeForm,
            },
            props: {
              'app-content': { list_type: 'order' },
              'app-subnav': true
            },
          },
          // actions
          {
            name: 'settings-statuscode-action-edit',
            path: 'action/form/:pk',
            props: {
              'app-content': { list_type: 'order' },
              'app-subnav': true
            },
            components: {
              'app-content': ActionForm,
            },
          },
          {
            name: 'settings-statuscode-action-add',
            path: 'action/form-new/:statuscode_pk',
            components: {
              'app-content': ActionForm,
            },
            props: {
              'app-content': { list_type: 'order' },
              'app-subnav': true
            },
          },
        ]
      },
      {
        path: 'users',
        children: [
          // employee users
          {
            name: 'settings-users-employees',
            path: 'employee-users',
            components: {
              'app-content': UserEmployeeList,
            },
          },
          {
            name: 'settings-employee-edit',
            path: 'employee-users/form/:pk',
            components: {
              'app-content': UserEmployeeForm,
            },
          },
          {
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
        children: [
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
          {
            meta: { authLevelNeeded: [AUTH_LEVELS.PLANNING] },
            name: 'settings-my-branch',
            path: 'form/my',
            components: {
              'app-content': BranchForm,
            },
          },
        ],
      },
      // equipment
      {
        path: 'equipment',
        meta: {
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
      ),
    ]
}]
