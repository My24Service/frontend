import TheAppLayout from '../components/TheAppLayout.vue'
import NotFound from "../views/shared/NotFound";
import ComingSoon from "../views/shared/ComingSoon";
import NoAccess from "../views/account/NoAccess";


export default [{
  path: '*',
  component: TheAppLayout,
  props: {
    hasSubNav: false,
  },
  children: [
    {
      meta: { needsAuth: false },
      name: 'coming-soon',
      path: '/coming-soon',
      components: {
        'app-content': ComingSoon,
      },
    },
    {
      meta: { needsAuth: false },
      name: 'not-found',
      path: '*',
      components: {
        'app-content': NotFound,
      },
    },
    {
      meta: { needsAuth: false },
      name: 'no-access',
      path: '/no-access',
      components: {
        'app-content': NoAccess,
      },
    },
  ]
}]
