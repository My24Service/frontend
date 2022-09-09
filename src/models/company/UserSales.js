import BaseModel from '@/models/base'


class SalesUser extends BaseModel {
  fields = {
    'username': '',
    'first_name': '',
    'last_name': '',
    'email': '',
    'password1': '',
    'password2': '',
    'password': '',
    'sales_user': {
      'uses_time_registration': false,
      'contract_hours_week': 0.0
    }
  }

  url = '/company/salesuser/'
}

let salesUserModel = new SalesUser()

export default salesUserModel
