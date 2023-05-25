import EquipmentList from '../views/equipment/EquipmentList.vue'
import EquipmentForm from '../views/equipment/EquipmentForm.vue'

import LocationList from '../views/equipment/LocationList.vue'
import LocationForm from '../views/equipment/LocationForm.vue'

import SubNavEquipment from "../components/SubNavEquipment";
import TheAppLayout from "../components/TheAppLayout";
import {AUTH_LEVELS} from "../constants";

export default [
  {
    path: '/equipment',
    component: TheAppLayout,
    // equipment
    children: [
      {
        meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
        name: 'equipment-equipment-list',
        path: '/equipment/equipment',
        components: {
          'app-content': EquipmentList,
          'app-subnav': SubNavEquipment
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
        name: 'equipment-equipment-edit',
        path: '/equipment/equipment/form/:pk',
        components: {
          'app-content': EquipmentForm,
          'app-subnav': SubNavEquipment
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
        name: 'equipment-equipment-add',
        path: '/equipment/equipment/form',
        components: {
          'app-content': EquipmentForm,
          'app-subnav': SubNavEquipment
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
      // locations
      {
        meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
        name: 'equipment-location-list',
        path: '/equipment/locations',
        components: {
          'app-content': LocationList,
          'app-subnav': SubNavEquipment
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
      {
        meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
        name: 'equipment-location-edit',
        path: '/equipment/locations/form/:pk',
        components: {
          'app-content': LocationForm,
          'app-subnav': SubNavEquipment
        },
        props: {
          'app-content': route => ({...route.params}),
          'app-subnav': {}
        },
      },
      {
        meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
        name: 'equipment-location-add',
        path: '/equipment/locations/form',
        components: {
          'app-content': LocationForm,
          'app-subnav': SubNavEquipment
        },
        props: {
          'app-content': {},
          'app-subnav': true
        },
      },
    ]
  }
]
