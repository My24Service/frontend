import BaseModel from '../base'

class BranchModel {
  name
  address
  postal
  city
  country_code = 'NL'
  tel
  email
  contact
  mobile

}

class BranchService extends BaseModel {
  fields = {
    'name': '',
    'address': '',
    'postal': '',
    'city': '',
    'country_code': 'NL',
    'tel': '',
    'email': '',
    'contact': '',
    'mobile': '',
  }

  url = '/company/branch/'

  search(query) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }

  getMyBranch() {
    return this.axios.get('/company/branch-my/').then((response) => response.data)
  }
  updateMyBranch(branch) {
    return this.axios.patch('/company/branch-my/', this.preUpdate(branch))
      .then((response) => response.data)
  }
}

export { BranchService, BranchModel }
