import BaseModel from '@/models/base'


class TripStatuscode extends BaseModel {
  fields = {
    'statuscode': '',
    'color': '',
    'start_trip': false,
    'end_trip': false,
    'description': '',
    'new_status_template': ''
  }

  url = '/mobile/trip-statuscode/'

}

let tripStatuscodeModel = new TripStatuscode()

export default tripStatuscodeModel
