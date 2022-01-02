import BaseModel from '@/models/base'


class Document extends BaseModel {
  fields = {
    'customer': null,
    'name': '',
    'description': '',
    'file': null,
    'user_can_view': true
  }

  url = '/customer/document/'
}

const documentModel = new Document()

export default documentModel
