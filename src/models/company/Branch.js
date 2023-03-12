import BaseModel from '../base'


class Branch extends BaseModel {
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
}

let branchModel = new Branch()

export default branchModel
