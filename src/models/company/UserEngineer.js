import BaseModel from '@/models/base'


class Engineer extends BaseModel {
  fields = {
    'username': '',
    'first_name': '',
    'last_name': '',
    'email': '',
    'password1': '',
    'password2': '',
    'password': '',
    'engineer': {
      'address': '',
      'postal': '',
      'city': '',
      'mobile': '',
      'email_tablet': '',
      'vca': '',
      'passport': '',
      'cost_price': 0,
      'license_plate': '',
      'inspection_date_car': '',
      'cost_price_car': 0,
      'inspection_date_tools': '',
      'cost_price_tools': 0,
      'remarks': '',
      'contract_hours_week': 38.0
    }
  }

  url = '/company/engineer/'

  stats(pk, year) {
    return this.axios.get(`${this.url}${pk}/stats/?year=${year}`).then((response) => response.data)
  }

}

let engineerModel = new Engineer()

export default engineerModel
