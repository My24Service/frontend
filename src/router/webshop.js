import TheAppLayout from '../components/TheAppLayout.vue'
import ComingSoon from '../views/shared/ComingSoon.vue';

export default [
  {
    path: '/webshop',
    component: TheAppLayout,
    props: {
      hasSubNav: false,
    },
    children: [
      {
        path: '/webshop',
        name: 'webshop',
        components: {
          'app-content': ComingSoon,
        },
      }
    ]
  }
];