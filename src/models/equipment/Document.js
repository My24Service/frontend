import BaseModel from '@/models/base'


class DocumentModel {
  id
  equipment
  location
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
    equipment: null,
    location: null,
    name: '',
    description: '',
    file: ''
  }

  url = '/equipment/equipment-document/'
  model = DocumentModel

  setParentId( id ) {
    this.setListArgs( `equipment=${id}` )
  }
  
  setParentBranchId(id) {
    this.setListArgs(`equipment__branch=${id}`);
  }

  setType(type) {
    this.setListArgs(`type=${type}`)
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

  setParentBranchId(id) {
    this.setListArgs(`location__branch=${id}`);
  }
}

const documentModel = new DocumentService()

export default documentModel
export { DocumentService, LocationDocumentService, DocumentModel }
