import BaseModel from '@/models/base'


class Action extends BaseModel {
  fields = {
    'name': '',
    'address': '',
    'subject': '',
    'type': 'email',
    'destination': '',
    'conditions': '',
    'description': '',
    'template': '',
    'company_partner': '',
    'json_conditions': [],
    'querymode': 'or',
    'statuscode': '',
  }

  url = '/order/action/'

}

let actionModel = new Action()

export default actionModel
