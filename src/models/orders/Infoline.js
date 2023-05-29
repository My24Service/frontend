import BaseModel from '../base'


class Infoline extends BaseModel {
  fields = {
    'order': null,
    'info': null,
  }

  url = '/order/infoline/'

}

let infolineModel = new Infoline()

export default infolineModel
