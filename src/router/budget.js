import TheAppLayout from '../components/TheAppLayout.vue'
import ComingSoon from '../views/shared/ComingSoon.vue';

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