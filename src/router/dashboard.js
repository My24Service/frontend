import TheAppLayout from '../components/TheAppLayout.vue'
import Dashboard from "../views/dashboard/Dashboard.vue";
import DashboardOverview from "../views/dashboard/DashboardOverview.vue";
import {AUTH_LEVELS} from "../constants";

export default [
  {
    path: '/',
    component: TheAppLayout,
    props: {
      hasSubNav: false,
    },
    children: [
      {
        path: '/dashboard',
        name: 'dashboard',
        meta: { authLevelNeeded: AUTH_LEVELS.EMPLOYEE },
        components: {
          'app-content': Dashboard,
        },
      },
      {
        path: '/overview',
        name: 'dashboard-overview',
        components: {
          'app-content': DashboardOverview,
        },
      }
    ]
  }
];
