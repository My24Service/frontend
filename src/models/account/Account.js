import BaseModel from '@/models/base'
import my24 from '@/services/my24'


class Account extends BaseModel {
  fields = {
  }

  url = '/company/activity/'

  sendResetPasswordLink(token, email) {
    const headers = this.getHeaders(token)
    const data = {
      login: email,
      isRegistration: false,
      isVue: true
    }

    return new Promise((resolve, reject) => {
      this.axios.post('/accounts/send-reset-password-link/', data, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  resetPassword(token, password) {
    const headers = this.getHeaders(token)
    const data = {
      user_id: my24.getParameterByName('user_id'),
      timestamp: my24.getParameterByName('timestamp'),
      signature: my24.getParameterByName('signature'),
      password
    }

    return new Promise((resolve, reject) => {
      this.axios.post('/accounts/reset-password/', data, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  changePassword(token, old_password, new_password1, new_password2) {
    const headers = this.getHeaders(token)
    const data = {
      old_password,
      new_password1,
      new_password2,
    }

    return new Promise((resolve, reject) => {
      this.axios.post('/rest-auth/password/change/', data, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })

  }

}

let accountModel = new Account()

export default accountModel
