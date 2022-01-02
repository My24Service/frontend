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
    }
  }

  url = '/company/planninguser/'
}

let planningUserModel = new PlanningUser()

export default planningUserModel
