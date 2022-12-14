import BaseModel from '../../models/base'
import moment from 'moment'


class ApiUser extends BaseModel {
  fields = {
    'api_user': {
      'name': null,
      'token': null,
      'expire_start_dt': moment(),
      'token_is_revoked': false,
      'expire_in_days': 365
    },
  }

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

    return order
  }

  async revoke(pk) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post(`${this.url}${pk}/revoke/`, {}, headers).then(response => response.data)
  }
}

let apiUserModel = new ApiUser()

export default apiUserModel
