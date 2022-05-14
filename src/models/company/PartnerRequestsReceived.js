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

  async accept(id) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.put(`${this.url}${id}/accept/`, {}, headers).then((response) => response.data)
  }

  async reject(id) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.put(`${this.url}${id}/reject/`, {}, headers).then((response) => response.data)
  }

}

let partnerRequestsReceivedModel = new PartnerRequestsReceived()

export default partnerRequestsReceivedModel
