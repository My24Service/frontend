import BaseModel from '../base'

class Import {
  id
  file
  mapping
  filter_on
  result_inserts

  constructor(data) {
    for (const [k, v] of Object.entries(data)) {
      this[k] = v
    }
  }
}

class ImportService extends BaseModel {
  url = '/company/import/'

  fetchAllowedExtensions(pk) {
    return this.axios.get(`${this.url}get_allowed_extensions/`).then((response) => response.data)
  }

  fetchRequired() {
    return this.axios.get(`${this.url}required/`).then((response) => response.data)
  }

  previewImport(pk) {
    return this.axios.get(`${this.url}${pk}/preview/`).then((response) => response.data)
  }

  doImport(pk) {
    return this.axios.post(`${this.url}${pk}/do_import/`).then((response) => response.data)
  }
}

export {Import, ImportService}
