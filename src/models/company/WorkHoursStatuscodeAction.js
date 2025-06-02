import BaseModel from '@/models/base'

class WorkHoursStatuscodeAction extends BaseModel {
  fields = {
    'name': '',
    'address': '',
    'subject': '',
    'type': 'email',
    'destination': '',
    'conditions': '',
    'description': '',
    'template': '',
    'json_conditions': [],
    'querymode': 'or',
    'statuscode': '',
  }

  url = '/mobile/work_hours-statuscode-action/'

}

let workHoursStatuscodeActionModel = new WorkHoursStatuscodeAction()

export default workHoursStatuscodeActionModel
