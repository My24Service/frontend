import BaseModel from '@/models/base'
import my24 from '@/services/my24'


class Account extends BaseModel {
  fields = {
  }

  url = '/company/activity/'

  setLanguage(language) {
    let bodyFormData = new FormData()
    bodyFormData.append('language', language)

    return this.axios.post('/set-language/', bodyFormData, {withCredentials:true})
  }

  async login(username, password) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = '/jwt-token/'

    const postData = {
      username: username,
      password: password,
      app: 'web'
    }

    return this.axios.post(url, postData, headers).then((response) => response.data)
  }

  refreshToken(token) {
    const headers = this.getHeaders()
    const url = '/jwt-token/refresh/'

    const postData = {
      token,
    }

    return this.axios.post(url, postData, headers).then((response) => response.data)
  }

  getUserDetails() {
    return this.axios.get('/company/user-info-me/').then(response => response.data)
  }

  async sendResetPasswordLink(idField, isRegistration=false) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const data = isRegistration ? {
      user_id: idField,
      isRegistration,
    } : {
      email: idField,
      isRegistration,
    }

    return this.axios.post('/accounts/send-reset-password-link/', data, headers).then((response) => response.data)
  }

  async resetPassword(password) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const data = {
      user_id: my24.getParameterByName('user_id'),
      timestamp: my24.getParameterByName('timestamp'),
      signature: my24.getParameterByName('signature'),
      password
    }

    return this.axios.post('/accounts/reset-password/', data, headers).then((response) => response.data)
  }

  async verify(data) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post('/accounts/verify-registration/', data, headers).then((response) => response.data)
  }

  async changePassword(old_password, new_password1) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const data = {
      old_password,
      new_password1,
    }

    return this.axios.post('/change-password/', data, headers).then((response) => response.data)
  }

  getUserInfo(pk) {
    return this.axios.get(`/company/user-info/${pk}/`).then(response => response.data)
  }
}

let accountModel = new Account()

export default accountModel
