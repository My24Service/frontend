

import SubNav from "../components/SubNav.vue";
import TheAppLayout from "../components/TheAppLayout.vue";
import {AUTH_LEVELS, EQUIPMENT_TYPES} from "../constants";

// Route screens, split per chunk: the router holds a loader, not the module.
const BuildingDetail = () => import('@/features/equipment/building/BuildingDetail.vue')
const BuildingForm = () => import('@/features/equipment/building/BuildingForm.vue')
const BuildingList = () => import('@/features/equipment/building/BuildingList.vue')
const EquipmentDetail = () => import('@/features/equipment/equipment/EquipmentDetail.vue')
const EquipmentForm = () => import('@/features/equipment/equipment/EquipmentForm.vue')
const EquipmentList = () => import('@/features/equipment/equipment/EquipmentList.vue')
const LocationDetail = () => import('@/features/equipment/location/LocationDetail.vue')
const LocationForm = () => import('@/features/equipment/location/LocationForm.vue')
const LocationList = () => import('@/features/equipment/location/LocationList.vue')

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
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
          {
            name: 'equipment-equipment-edit',
            path: 'form/:pk',
            components: {
              'app-content': EquipmentForm,
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
          {
            name: 'equipment-equipment-view',
            path: ':pk',
            components: {
              'app-content': EquipmentDetail,
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
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
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
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
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
          {
            name: 'equipment-location-edit',
            path: 'form/:pk',
            components: {
              'app-content': LocationForm,
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
          {
            name: 'equipment-location-view',
            path: ':pk',
            components: {
              'app-content': LocationDetail,
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
          {
            name: 'equipment-location-add',
            path: 'form',
            components: {
              'app-content': LocationForm,
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
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
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
          {
            name: 'equipment-building-edit',
            path: 'form/:pk',
            components: {
              'app-content': BuildingForm,
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
          {
            name: 'equipment-building-view',
            path: ':pk',
            components: {
              'app-content': BuildingDetail,
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
          {
            name: 'equipment-building-add',
            path: 'form',
            components: {
              'app-content': BuildingForm,
              'app-subnav': SubNav,
            },
            props: {
              'app-subnav': { section: 'equipment' },
            },
          },
        ],
      },
    ]
  },
]
