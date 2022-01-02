import TheAppLayout from '@/components/TheAppLayout'

import TheNoAccessLayout from '@/views/account/NoAccess'
import ResetPassword from '@/views/account/ResetPassword'
import ResetPasswordConfirm from '@/views/account/ResetPasswordConfirm'


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
