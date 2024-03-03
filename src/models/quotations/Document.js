import BaseModel from '@/models/base'


class DocumentService extends BaseModel {
  fields = {
    quotation: null,
    name: '',
    description: '',
    file: ''
  }

  url = '/quotation/document/'
}

const documentService = new DocumentService()

export default documentService
export { DocumentService }
