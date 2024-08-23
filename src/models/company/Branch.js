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
}

let branchService = new BranchService()

export default branchService
export { BranchService, BranchModel }
