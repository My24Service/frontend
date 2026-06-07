import BaseModel from '@/models/base'


class StatusService extends BaseModel {
  fields = {
    'order_id': null,
    'assignedorder_id': null,
    'status': '',
  }

  url = '/order/status/'

}

class StatusesService extends BaseModel {
  url = '/order/statuses/'
}

let statusModel = new StatusService()

export default statusModel
export { StatusService, StatusesService }
