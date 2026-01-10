import BaseModel from '@/models/base'

class AccountService extends BaseModel {
  fields = {
  }

  url = '/company/activity/'

  setLanguage(language) {
    let bodyFormData = new FormData()
    bodyFormData.append('language', language)

    return this.axios.post('/set-language/', bodyFormData, {withCredentials:true})
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
}

export {AccountService}
