import TheAppLayout from '../components/TheAppLayout.vue'

// Route screens, split per chunk: the router holds a loader, not the module.
const BIMFrame = () => import('../views/bim/BIMFrame.vue')

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
