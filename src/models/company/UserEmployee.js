import BaseModel from '../../models/base'


class EmployeeService extends BaseModel {
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
      'contract_hours_week': 0.0,
      'branch': null
    }
  }

  url = '/company/employeeuser/'
}

export {EmployeeService}
