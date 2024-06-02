import BaseModel from '../base'


class UserListService extends BaseModel {
  url = '/company/user-list/'

  search(query) {
    return this.axios.get(`${this.url}?q=${query}`).then((response) => response.data)
  }
}

export { UserListService }
