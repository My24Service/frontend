import BaseModel from '../base'


class InfolineService extends BaseModel {
  fields = {
    'order': null,
    'info': null,
  }

  url = '/order/infoline/'

}

let infolineModel = new InfolineService()

export default infolineModel
export { InfolineService }
