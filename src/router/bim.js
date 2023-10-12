import TheAppLayout from '../components/TheAppLayout.vue'
import BIMFrame from '../views/bim/BIMFrame.vue';

export default [
  {
    path: '/',
    component: TheAppLayout,
    props: {
      hasSubNav: false,
    },
    children: [
      {
        path: '/bim',
        name: 'bim-frame',
        components: {
          'app-content': BIMFrame,
        },
      }
    ]
  }
];
