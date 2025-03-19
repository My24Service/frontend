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

  url = '/equipment/equipment-document/'
  model = DocumentModel

  setParentId( id ) {
    this.setListArgs( `equipment=${id}` )
  }
}

class LocationDocumentService extends DocumentService {
  fields = {
    order: null,
    name: '',
    description: '',
    file: ''
  }

  url = '/equipment/location-document/'
  model = DocumentModel

  setParentId( id ) {
    this.setListArgs( `location=${id}` )
  }
}

const documentModel = new DocumentService()

export default documentModel
export { DocumentService, LocationDocumentService, DocumentModel }
