import BaseModel from '@/models/base'

// EQUIPMENT_QR_TYPES = (
//   ('none', 'none'),
//     ('my24service', 'my24service'),
//     ('shltr', 'shltr'),
// )

export const EQUIPMENT_QR_TYPE_NONE = 'none'
export const EQUIPMENT_QR_TYPE_SHLTR = 'shltr'
export const EQUIPMENT_QR_TYPE_MY24SERVICE = 'my24service'

let EQUIPMENT_QR_TYPES = {}
EQUIPMENT_QR_TYPES[EQUIPMENT_QR_TYPE_NONE] = 'none'
EQUIPMENT_QR_TYPES[EQUIPMENT_QR_TYPE_MY24SERVICE] = 'My24Service'
EQUIPMENT_QR_TYPES[EQUIPMENT_QR_TYPE_SHLTR] = 'SHLTR'

export {EQUIPMENT_QR_TYPES}

class MemberModel {
  companycode
  name
  address
  postal
  city
  country_code
  tel
  fax
  www
  email
  contacts
  activities
  info
  companylogo
  companylogo_url
  companylogo_workorder
  data
  contract
  is_deleted = false
  member_type
  is_public = true
  has_api_users = false
  has_branches = false
  chamber_of_commerce
  vat_number
  equipment_qr_type
  is_requested = true

  constructor(member) {
    for (const [k, v] of Object.entries(member)) {
      this[k] = v
    }
  }
}

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

  async getRequestedCount() {
    const url = `${this.url}requested_count/`

    return this.axios.get(url).then((response) => response.data)
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
export { MemberService, MemberModel }
