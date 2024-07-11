import BaseModel from '@/models/base'

class DocumentModel {
  id
  customer
  name
  description
  file
  user_can_view = true

  constructor(document) {
    for (const [k, v] of Object.entries(document)) {
      this[k] = v
    }

  }
}

class DocumentService extends BaseModel {
  url = '/customer/document/'
  model = DocumentModel
}

const documentModel = new DocumentService()

export { DocumentService, DocumentModel }

export default documentModel
