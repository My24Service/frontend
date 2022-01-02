import BaseModel from '@/models/base'


class Activity extends BaseModel {
  fields = {
    'id':null,
    'text': null,
    'created': null,
  }

  url = '/company/activity/'

}

let activityModel = new Activity()

export default activityModel
