import BaseModel from '@/models/base'


class Document extends BaseModel {
  fields = {
    order: null,
    name: '',
    description: '',
    file: ''
  }

  url = '/order/document/'
}

const documentModel = new Document()

export default documentModel
