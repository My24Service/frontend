import BaseModel from '@/models/base'


class DocumentModel {
  id
  quotation
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
  url = '/quotation/document/'
  model = DocumentModel
}

export { DocumentService, DocumentModel }
