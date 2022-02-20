import TheAppLayout from '@/components/TheAppLayout.vue'

import TheNoAccessLayout from '@/views/account/NoAccess.vue'
import ResetPassword from '@/views/account/ResetPassword.vue'
import ResetPasswordConfirm from '@/views/account/ResetPasswordConfirm.vue'


export default [{
  path: '/account',
  component: TheAppLayout,
  props: {
    hasSubNav: false,
  },
  children: [
      {
        name: 'reset-password',
        path: '/reset-password',
        components: {
          'app-content': ResetPassword,
        },
      },
      {
        name: 'reset-password-confirm',
        path: '/reset-password-confirm',
        components: {
          'app-content': ResetPasswordConfirm,
        },
      },
      {
        name: 'no-access',
        path: '/no-access',
        component: TheNoAccessLayout
      },
  ]
}]
