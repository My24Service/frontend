import TheAppLayout from '../components/TheAppLayout.vue'
import DashboardView from "../views/dashboard/DashboardView.vue";
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
          'app-content': DashboardView,
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
