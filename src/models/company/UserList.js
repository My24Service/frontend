import BaseModel from '../base'


class UserListService extends BaseModel {
  url = '/company/user-list/'

  search(query, userType=null) {
    let url = `${this.url}?q=${query}`

    if (userType) {
      url = `${url}&user_type=${userType}`
    }

    return this.axios.get(url).then((response) => response.data)
  }
}

export { UserListService }
