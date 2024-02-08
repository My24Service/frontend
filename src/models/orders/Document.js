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

const documentService = new DocumentService()

export default documentService
export { DocumentService }
