import TheAppLayout from '../components/TheAppLayout.vue'
import {AUTH_LEVELS} from "../constants";

// Route screens, split per chunk: the router holds a loader, not the module.
const DashboardOverview = () => import('../views/dashboard/DashboardOverview.vue')
const DashboardView = () => import('../views/dashboard/DashboardView.vue')

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
