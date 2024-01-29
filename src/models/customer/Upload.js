import BaseModel from '../base'

class CustomerUpload {
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

class CustomerUploadService extends BaseModel {
  url = '/customer/upload/'

  readHead(pk) {
    return this.axios.get(`${this.url}${pk}/read_head/`).then((response) => response.data)
  }

  fetchAllowedExtensions(pk) {
    return this.axios.get(`${this.url}get_allowed_extensions/`).then((response) => response.data)
  }

  fetchRequired(pk) {
    return this.axios.get(`${this.url}required/`).then((response) => response.data)
  }

  previewUpload(pk) {
    return this.axios.get(`${this.url}${pk}/preview_upload/`).then((response) => response.data)
  }

  doUpload(pk) {
    return this.axios.post(`${this.url}${pk}/do_upload/`).then((response) => response.data)
  }
}

export {CustomerUpload, CustomerUploadService}
