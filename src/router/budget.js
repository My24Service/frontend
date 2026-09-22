import TheAppLayout from '../components/TheAppLayout.vue'

// Route screens, split per chunk: the router holds a loader, not the module.
const ComingSoon = () => import('../views/shared/ComingSoon.vue')

export default [
  {
    path: '/budget',
    component: TheAppLayout,
    props: {
      hasSubNav: false,
    },
    children: [
      {
        path: '/budget',
        name: 'budget-dashboard',
        components: {
          'app-content': ComingSoon,
        },
      }
    ]
  }
];