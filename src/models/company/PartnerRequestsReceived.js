import BaseModel from '@/models/base'


class PartnerRequestsReceived extends BaseModel {
  fields = {
    'from_member': null,
    'from_member_view': {},
    'to_member': null,
    'to_member_view': {},
    'status': '',
    'created': '',
    'modified': ''
  }

  url = '/company/partner-request/'

  getListUrl() {
    return '/company/partner-request/received/'
  }

  accept(token, id) {
    const headers = this.getHeaders(token)

    return new Promise((resolve, reject) => {
      this.axios.put(`${this.url}${id}/accept/`, {}, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  reject(token, id) {
    const headers = this.getHeaders(token)

    return new Promise((resolve, reject) => {
      this.axios.put(`${this.url}${id}/reject/`, {}, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

}

let partnerRequestsReceivedModel = new PartnerRequestsReceived()

export default partnerRequestsReceivedModel
