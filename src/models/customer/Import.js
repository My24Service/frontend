import BaseModel from '../base'

class CustomerImport {
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

class CustomerImportService extends BaseModel {
  url = '/customer/import/'

  readHead(pk) {
    return this.axios.get(`${this.url}${pk}/read_head/`).then((response) => response.data)
  }

  fetchAllowedExtensions(pk) {
    return this.axios.get(`${this.url}get_allowed_extensions/`).then((response) => response.data)
  }

  fetchRequired(pk) {
    return this.axios.get(`${this.url}required/`).then((response) => response.data)
  }

  previewImport(pk) {
    return this.axios.get(`${this.url}${pk}/preview/`).then((response) => response.data)
  }

  doImport(pk) {
    return this.axios.post(`${this.url}${pk}/do_import/`).then((response) => response.data)
  }
}

export {CustomerImport, CustomerImportService}
