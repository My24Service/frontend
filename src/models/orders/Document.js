import BaseModel from '@/models/base'


class DocumentService extends BaseModel {
  fields = {
    order: null,
    name: '',
    description: '',
    file: ''
  }

  url = '/order/document/'
}

const documentModel = new DocumentService()

export default documentModel
export { DocumentService }
