import BaseModel from '@/models/base'


class Module extends BaseModel {
  fields = {
    'name': ''
  }

  url = '/member/module/'

}

let moduleModel = new Module()

export default moduleModel
