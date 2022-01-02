import BaseModel from '@/models/base'


class Picture extends BaseModel {
  fields = {
    'id': null,
    'picture': null,
    'name': null,
    'created': null,
  }

  url = '/company/picture/'

}

let pictureModel = new Picture()

export default pictureModel
