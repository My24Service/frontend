import TheAppLayout from '../components/TheAppLayout.vue'

// Route screens, split per chunk: the router holds a loader, not the module.
const Webshop = () => import('../views/webshop/WebshopIframe.vue')

export default [
  {
    path: '/',
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
