import TheAppLayout from '../components/TheAppLayout.vue'
import Webshop from '../views/webshop/WebshopIframe.vue';

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
          'app-content': Webshop,
        },
      }
    ]
  }
];