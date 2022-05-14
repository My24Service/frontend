import BaseModel from '@/models/base'


class Contract extends BaseModel {
  fields = {
    'name': '',
    'modules_text': '',
    'max_users': 0,
    'module_paths_pks': ''
  }

  url = '/member/contract/'

  getModuleData() {
    const url = '/member/get-module-data/'

    return this.axios.get(url).then((response) => response.data)
  }

}

let contractModel = new Contract()

export default contractModel
