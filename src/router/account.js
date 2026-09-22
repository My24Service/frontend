import TheAppLayout from '../components/TheAppLayout.vue'

// Route screens, split per chunk: the router holds a loader, not the module.
const NoAccessView = () => import('@/features/account/NoAccessView.vue')
const ResetPasswordConfirmView = () => import('@/features/account/ResetPasswordConfirmView.vue')
const SendResetLinkView = () => import('@/features/account/SendResetLinkView.vue')

// The account screens live in the feature folder; this file only routes them.

export default [{
  path: '/account',
  component: TheAppLayout,
  props: {
    hasSubNav: false,
  },
  children: [
      {
        meta: { needsAuth: false },
        name: 'reset-password',
        path: '/reset-password',
        components: {
          'app-content': SendResetLinkView,
        },
      },
      {
        meta: { needsAuth: false },
        name: 'reset-password-confirm',
        path: '/reset-password-confirm',
        components: {
          'app-content': ResetPasswordConfirmView,
        },
      },
      {
        meta: { needsAuth: false },
        name: 'no-access',
        path: '/no-access',
        components: {
          'app-content' : NoAccessView,
        }
      },
  ]
}]
