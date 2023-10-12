import BaseModel from '@/models/base'


class MemberService extends BaseModel {
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
    'member_type': '',
    'is_public': true,
    'has_api_users': false,
    'has_branches': false,
    'chamber_of_commerce': null,
    'vat_number': null,
  }

  url = '/member/member/'

  getMe() {
    return this.axios.get(`${this.url}me/`).then((response) => response.data)
  }

  async getDeleted() {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.url}deleted/`

    return this.axios.get(url, headers).then((response) => response.data)
  }

  async updateMe(obj) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.patch(`${this.url}me/`, obj, headers).then((response) => response.data)
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

  getVATTypes() {
    return this.axios.get(`/member/vat-types/`).then((response) => response.data)
  }

  getOCIUrl() {
    return this.axios.get(`${this.url}get_oci_url/`).then((response) => response.data)
  }

}

let memberService = new MemberService()

export default memberService
export { MemberService }
