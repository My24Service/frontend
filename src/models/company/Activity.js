import BaseModel from '../../models/base'


class ActivityService extends BaseModel {
  fields = {
    'id':null,
    'text': null,
    'created': null,
  }

  url = '/company/activity/'

}

let activityService = new ActivityService()

export default activityService
export  { ActivityService }
