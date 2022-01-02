import BaseModel from '@/models/base'


class ModulePart extends BaseModel {
  fields = {
    'name': '',
    'module': 0,
    'module_name': ''
  }

  url = '/member/module-part/'

}

let modulePartModel = new ModulePart()

export default modulePartModel
