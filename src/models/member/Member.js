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
    return new Promise((resolve, reject) => {
      this.axios.get(`${this.url}me/`)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  updateMe(token, obj) {
    const headers = this.getHeaders(token)

    return new Promise((resolve, reject) => {
      this.axios.put(`${this.url}me/`, obj, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  getSettings() {
    return new Promise((resolve, reject) => {
      this.axios.get(`${this.url}my_settings/`)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  updateSettings(token, obj) {
    const headers = this.getHeaders(token)

    return new Promise((resolve, reject) => {
      this.axios.put(`${this.url}my_settings/`, obj, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  getForPartnerSelect(query) {
    return new Promise((resolve, reject) => {
      this.axios.get(`${this.url}get_for_partner_select/?q=${query}`)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })

  }

  companycodeExists(companycode) {
    return new Promise((resolve, reject) => {
      this.axios.get(`/member/companycode-exists/?companycode=${companycode}`)
        .then((response) => {
          resolve(response.data['available'])
        })
        .catch((error) => {
          reject(error)
        })
    })

  }

}

let memberModel = new Member()

export default memberModel
