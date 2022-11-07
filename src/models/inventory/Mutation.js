import BaseModel from '@/models/base'


class Mutation extends BaseModel {
  fields = {
    'material': null,
    'material_name': '',
    'summary': '',
    'location': null,
    'location_name': '',
    'mutation_type': 'correction-in',
    'amount': 0
  }

  url = '/inventory/stockmutationsimple-list/'

}

let mutationModel = new Mutation()

export default mutationModel
