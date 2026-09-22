import TheAppLayout from '../components/TheAppLayout.vue'

// Route screens, split per chunk: the router holds a loader, not the module.
const ComingSoon = () => import('../views/shared/ComingSoon')
const NotFound = () => import('../views/shared/NotFound')

export default [{
  path: '/:pathMatch(.*)*',
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
      path: '/:pathMatch(.*)*',
      components: {
        'app-content': NotFound,
      },
    },
  ]
}]
