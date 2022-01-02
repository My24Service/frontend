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
    }
  }

  url = '/company/salesuser/'
}

let salesUserModel = new SalesUser()

export default salesUserModel
