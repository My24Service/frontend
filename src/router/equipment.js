import EquipmentList from '@/features/equipment/equipment/EquipmentList.vue'
import EquipmentForm from '../features/equipment/equipment/EquipmentForm.vue'

import LocationList from '@/features/equipment/location/LocationList.vue'
import LocationForm from '../features/equipment/location/LocationForm.vue'

import SubNavEquipment from "../components/SubNavEquipment";
import TheAppLayout from "../components/TheAppLayout.vue";
import {AUTH_LEVELS, EQUIPMENT_TYPES} from "../constants";
import EquipmentDetail from "@/features/equipment/equipment/EquipmentDetail.vue";
import LocationDetail from "@/features/equipment/location/LocationDetail.vue";

import BuildingList from "@/features/equipment/building/BuildingList.vue";
import BuildingForm from "../features/equipment/building/BuildingForm.vue";
import BuildingDetail from "@/features/equipment/building/BuildingDetail.vue";

export default [
  {
    path: '/equipment',
    component: TheAppLayout,
    meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
    // equipment
    children: [
      {
        path: 'equipment',
        meta: {
          // Using meta instead of props, because meta data,
          // is automatically passed down to the children.
          // `TheAppLayout` turns these into actual props.
          props: {
            route_prefix: 'equipment-equipment',
          },
        },
        children: [
          {
            name: 'equipment-equipment-list',
            path: `:type(${Object.values(EQUIPMENT_TYPES).join('|')})`,
            components: {
              'app-content': EquipmentList,
              'app-subnav': SubNavEquipment,
            },
          },
          {
            name: 'equipment-equipment-edit',
            path: 'form/:pk',
            components: {
              'app-content': EquipmentForm,
              'app-subnav': SubNavEquipment,
            },
          },
          {
            name: 'equipment-equipment-view',
            path: ':pk',
            components: {
              'app-content': EquipmentDetail,
              'app-subnav': SubNavEquipment,
            },
          },
          ...Object.values(EQUIPMENT_TYPES).map((item) => {
            return {
              name: `equipment-equipment-view-${item}`,
              path: `${item}/:pk`,
              components: {
                'app-content': EquipmentDetail,
              },
            }
          }),
          ...Object.values(EQUIPMENT_TYPES).map((item) => {
            return {
              name: `equipment-equipment-edit-${item}`,
              path: `${item}/form/:pk`,
              components: {
                'app-content': EquipmentForm,
              },
            }
          }),
          {
            name: 'equipment-equipment-add',
            path: 'form',
            components: {
              'app-content': EquipmentForm,
              'app-subnav': SubNavEquipment,
            },
          },
        ],
      },
      // locations
      {
        path: '/equipment/locations',
        meta: {
          props: {
            route_prefix: 'equipment-location',
          },
        },
        children: [
          {
            name: 'equipment-location-list',
            path: '',
            components: {
              'app-content': LocationList,
              'app-subnav': SubNavEquipment,
            },
          },
          {
            name: 'equipment-location-edit',
            path: 'form/:pk',
            components: {
              'app-content': LocationForm,
              'app-subnav': SubNavEquipment,
            },
          },
          {
            name: 'equipment-location-view',
            path: ':pk',
            components: {
              'app-content': LocationDetail,
              'app-subnav': SubNavEquipment,
            },
          },
          {
            name: 'equipment-location-add',
            path: 'form',
            components: {
              'app-content': LocationForm,
              'app-subnav': SubNavEquipment,
            },
          },
        ],
      },
      // buildings
      {
        path: '/equipment/buildings',
        children: [
          {
            name: 'equipment-building-list',
            path: '/equipment/buildings',
            components: {
              'app-content': BuildingList,
              'app-subnav': SubNavEquipment,
            },
          },
          {
            name: 'equipment-building-edit',
            path: 'form/:pk',
            components: {
              'app-content': BuildingForm,
              'app-subnav': SubNavEquipment,
            },
          },
          {
            name: 'equipment-building-view',
            path: ':pk',
            components: {
              'app-content': BuildingDetail,
              'app-subnav': SubNavEquipment,
            },
          },
          {
            name: 'equipment-building-add',
            path: 'form',
            components: {
              'app-content': BuildingForm,
              'app-subnav': SubNavEquipment,
            },
          },
        ],
      },
    ]
  },
]
