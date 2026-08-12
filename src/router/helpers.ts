import type { RouteLocationNormalized } from 'vue-router'

import UserFilterList from "../views/shared/UserFilterList.vue";
import SubNavOrders from "../components/SubNavOrders.vue";
import UserFilterForm from "../views/shared/UserFilterForm.vue";

function createUserFilterRoutes(name_part: string, path_part: string, filter_type: string, from_settings = false) {
  return [
    {
      name: `${name_part}-filter-list`,
      path: `/${path_part}/filter`,
      components: {
        'app-content': UserFilterList,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': () => ({
          type: filter_type,
          route_name_part: name_part,
          from_settings
        }),
        'app-subnav': true
      },
    },
    {
      name: `${name_part}-filter-add`,
      path: `/${path_part}/filter/form`,
      components: {
        'app-content': UserFilterForm,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': () => ({
          type: filter_type,
          route_name_part: name_part,
        }),
        'app-subnav': true
      },
    },
    {
      name: `${name_part}-filter-edit`,
      path: `/${path_part}/filter/form/:pk`,
      props: {
        'app-content': (route: RouteLocationNormalized) => ({
          ...route.params,
          type: filter_type,
          route_name_part: name_part,
        }),
        'app-subnav': true
      },
      components: {
        'app-content': UserFilterForm,
        'app-subnav': SubNavOrders
      },
    },
  ]
}

export {createUserFilterRoutes}
