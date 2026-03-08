import TheAppLayout from '../components/TheAppLayout.vue'
import Startpage from "../views/company/Startpage.vue";

export default [
  {
    path: '/',
    component: TheAppLayout,
    props: {
      hasSubNav: false,
    },
    children: [
      {
        path: '/startpage',
        name: 'startpage',
        components: {
          'app-content': Startpage,
        },
      }
    ]
  }
];
