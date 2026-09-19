import type { RouteLocationNormalized } from 'vue-router'

import UserFilterList from "../views/shared/UserFilterList.vue";
import SubNav from "../components/SubNav.vue";
import UserFilterForm from "../views/shared/UserFilterForm.vue";

function createUserFilterRoutes(name_part: string, path_part: string, filter_type: string, from_settings = false) {
  return [
    {
      name: `${name_part}-filter-list`,
      path: `/${path_part}/filter`,
      components: {
        'app-content': UserFilterList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': () => ({
          type: filter_type,
          route_name_part: name_part,
          from_settings
        }),
        'app-subnav': { section: 'orders' }
      },
    },
    {
      name: `${name_part}-filter-add`,
      path: `/${path_part}/filter/form`,
      components: {
        'app-content': UserFilterForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': () => ({
          type: filter_type,
          route_name_part: name_part,
        }),
        'app-subnav': { section: 'orders' }
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
        'app-subnav': { section: 'orders' }
      },
      components: {
        'app-content': UserFilterForm,
        'app-subnav': SubNav
      },
    },
  ]
}

export {createUserFilterRoutes}
