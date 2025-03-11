import BaseModel from '@/models/base'


class DocumentModel {
  id
  order
  name
  description
  file

  constructor(document) {
    for (const [k, v] of Object.entries(document)) {
      this[k] = v
    }
  }
}

class DocumentService extends BaseModel {
  fields = {
    order: null,
    name: '',
    description: '',
    file: ''
  }

  url = '/equipment/document/'
  model = DocumentModel
}

const documentModel = new DocumentService()

export default documentModel
export { DocumentService, DocumentModel }
