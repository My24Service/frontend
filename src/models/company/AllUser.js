import BaseModel from '../base'


class AllUserService extends BaseModel {
  url = '/company/alluser/'

  search(query) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }
}

export { AllUserService }
