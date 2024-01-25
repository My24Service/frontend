import BaseModel from '../base'

class CustomerUpload {
  id
  file

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
}

export {CustomerUpload, CustomerUploadService}
