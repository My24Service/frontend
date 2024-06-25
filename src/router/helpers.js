import UserFilterList from "../views/shared/UserFilterList";
import SubNavOrders from "../components/SubNavOrders";
import UserFilterForm from "../views/shared/UserFilterForm";

function createUserFilterRoutes(name_part, path_part, filter_type) {
  return [
    {
      name: `${name_part}-filter-list`,
      path: `/${path_part}/filter`,
      components: {
        'app-content': UserFilterList,
        'app-subnav': SubNavOrders
      },
      props: {
        'app-content': route => ({...route.params, type: filter_type}),
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
        'app-content': route => ({...route.params, type: filter_type}),
        'app-subnav': true
      },
    },
    {
      name: `${name_part}-filter-edit`,
      path: `/${path_part}/filter/form/:pk`,
      props: {
        'app-content': route => ({...route.params, type: filter_type}),
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
