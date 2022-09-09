import BaseModel from '@/models/base'


class PlanningUser extends BaseModel {
  fields = {
    'username': '',
    'first_name': '',
    'last_name': '',
    'email': '',
    'password1': '',
    'password2': '',
    'password': '',
    'planning_user': {
      'uses_time_registration': false,
      'contract_hours_week': 0.0
    }
  }

  url = '/company/planninguser/'
}

let planningUserModel = new PlanningUser()

export default planningUserModel
