import BaseModel from '@/models/base'


class Statuscode extends BaseModel {
  fields = {
    'statuscode': '',
    'color': '',
    'text_color': '',
    'start_order': false,
    'end_order': false,
    'after_end_order': false,
    'description': '',
    'new_status_template': '',
    'color_for_assignedorders': false,
    'can_be_reassigned_after_end': false,
    'as_filter': false
  }

  url = '/order/statuscode/'

}

let statuscodeModel = new Statuscode()

export default statuscodeModel
