import TheAppLayout from '../components/TheAppLayout.vue'
import Dashboard from "../views/dashboard/Dashboard.vue";

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
        components: {
          'app-content': Dashboard,
        },
      }
    ]
  }
];
