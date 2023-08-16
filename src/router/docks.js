import TheAppLayout from '../components/TheAppLayout.vue'
import DockView from '../views/docks/DockMockup.vue';

export default [
  {
    path: '/docks',
    component: TheAppLayout,
    props: {
      hasSubNav: false,
    },
    children: [
      {
        path: '/docks',
        name: 'docks-mockup',
        components: {
          'app-content': DockView,
        },
      }
    ]
  }
];