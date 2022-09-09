import BaseModel from '@/models/base'


class CustomerUser extends BaseModel {
  fields = {
    'username': '',
    'full_name': '',
    'first_name': '',
    'last_name': '',
    'email': '',
    'password1': '',
    'password2': '',
    'password': '',
    'customer_user': {
      'customer': null,
      'settings_group': '',
      // 'uses_time_registration': false
    },
    'customer_details': {},
    'uses_time_registration': false
  }

  url = '/company/customeruser/'
}

let customerUserModel = new CustomerUser()

export default customerUserModel
