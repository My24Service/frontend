import BaseModel from '../../models/base'


class EmployeeUser extends BaseModel {
  fields = {
    'username': '',
    'first_name': '',
    'last_name': '',
    'email': '',
    'password1': '',
    'password2': '',
    'password': '',
    'employee_user': {
      'uses_time_registration': true,
      'contract_hours_week': 0.0
    }
  }

  url = '/company/employeeuser/'
}

let employeeUserModel = new EmployeeUser()

export default employeeUserModel
