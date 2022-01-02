import BaseModel from '@/models/base'


class TripStatuscodeAction extends BaseModel {
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

  url = '/mobile/trip-statuscode-action/'

}

let tripStatuscodeActionModel = new TripStatuscodeAction()

export default tripStatuscodeActionModel
