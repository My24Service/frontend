import BaseModel from '@/models/base'


class Member extends BaseModel {
  fields = {
    'companycode': '',
    'name': '',
    'address': '',
    'postal': '',
    'city': '',
    'country_code': '',
    'tel': '',
    'fax': '',
    'www': '',
    'email': '',
    'contacts': '',
    'activities': '',
    'info': '',
    'companylogo': '',
    'data': '',
    'contract': '',
    'is_deleted': false,
    'member_type': ''
  }

  url = '/member/member/'

  getMe() {
    return this.axios.get(`${this.url}me/`).then((response) => response.data)
  }

  async updateMe(obj) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.put(`${this.url}me/`, obj, headers).then((response) => response.data)
  }

  getSettings() {
    return this.axios.get(`${this.url}my_settings/`).then((response) => response.data)
  }

  async updateSettings(obj) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.put(`${this.url}my_settings/`, obj, headers).then((response) => response.data)
  }

  getForPartnerSelect(query) {
    return this.axios.get(`${this.url}get_for_partner_select/?q=${query}`).then((response) => response.data)
  }

  companycodeExists(companycode) {
    return this.axios.get(`/member/companycode-exists/?companycode=${companycode}`).then((response) => response.data['available'])
  }
}

let memberModel = new Member()

export default memberModel
