import BaseModel from '@/models/base'


class Mutation extends BaseModel {
  fields = {
    'material_name': '',
    'summary': '',
    'location': null,
    'amount': 0
  }

  url = '/inventory/stockmutationsimple-list/'

}

let mutationModel = new Mutation()

export default mutationModel
