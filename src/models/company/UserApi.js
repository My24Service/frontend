import BaseModel from '../../models/base'
import moment from 'moment'

class ApiUserUserModel {
  id
  username
  first_name
  last_name
  full_name
  email
  password1
  password2
  password
  date_joined
  api_user

  constructor(user) {
    for (const [k, v] of Object.entries(user)) {
      if (k === 'api_user') {
        this.api_user = new ApiUserModel(v)
      } else {
        this[k] = v
      }
    }

    if(!this.api_user) {
      this.api_user = new ApiUserModel({})
    }
  }
}

class ApiUserModel {
  name
  token
  expire_start_dt = moment()
  token_is_revoked = false
  expire_in_days = 365

  constructor(user) {
    for (const [k, v] of Object.entries(user)) {
      this[k] = v
    }
  }
}

class ApiUserService extends BaseModel {
  url = '/company/apiuser/'

  preInsert(apiuser) {
    // check date types
    if (typeof apiuser.api_user.expire_start_dt === 'object') {
      apiuser.api_user.expire_start_dt = moment(apiuser.api_user.expire_start_dt).format('YYYY-MM-DD')
    }

    return apiuser
  }

  preUpdate(apiuser) {
    // check date types
    if (typeof apiuser.api_user.expire_start_dt === 'object') {
      apiuser.api_user.expire_start_dt = moment(apiuser.api_user.expire_start_dt).format('YYYY-MM-DD')
    }

    return apiuser
  }

  async revoke(pk) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post(`${this.url}${pk}/revoke/`, {}, headers).then(response => response.data)
  }
}

export {ApiUserService, ApiUserUserModel, ApiUserModel}
