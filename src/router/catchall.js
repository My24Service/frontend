import TheAppLayout from '../components/TheAppLayout.vue'
import NotFound from "../views/shared/NotFound";


export default [{
  path: '*',
  component: TheAppLayout,
  props: {
    hasSubNav: false,
  },
  children: [
      {
        meta: { needsAuth: false },
        name: 'not-found',
        path: '*',
        components: {
          'app-content': NotFound,
        },
      },
  ]
}]
