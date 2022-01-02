import BaseModel from '@/models/base'


class Status extends BaseModel {
  fields = {
    'order_id': null,
    'assignedorder_id': null,
    'status': '',
  }

  url = '/order/status/'

}

let statusModel = new Status()

export default statusModel
