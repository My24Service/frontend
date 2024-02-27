import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";

class EngineerUserModel {
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
  engineer

  constructor(user) {
    for (const [k, v] of Object.entries(user)) {
      if (k === 'engineer') {
        this.engineer = new EngineerModel(v)
      } else {
        this[k] = v
      }
    }
  }
}

class RateEngineerUserModel {
  id
  full_name
  engineer

  constructor(user) {
    for (const [k, v] of Object.entries(user)) {
      if (k === 'engineer') {
        this.engineer = new RateEngineerModel(v)
      } else {
        if (this.hasOwnProperty(k)) {
          this[k] = v
        }
      }
    }
  }
}

class RateEngineerModel {
  default_currency
  hourly_rate
  hourly_rate_currency

  priceFields = ['hourly_rate']

  constructor(engineer) {
    for (const [k, v] of Object.entries(engineer)) {
      if (this.hasOwnProperty(k)) {
        this[k] = v
      }
    }
    this.setPriceFields(this)
  }

  setHourlyRate(priceDinero) {
    return this.setPriceField('hourly_rate', priceDinero)
  }

}

Object.assign(RateEngineerModel.prototype, priceMixin);

class EngineerModel {
  address
  postal
  city
  mobile
  email_tablet
  vca
  passport
  cost_price
  license_plate
  inspection_date_car
  cost_price_car
  inspection_date_tools
  cost_price_tools
  remarks
  contract_hours_week
  latest_event
  preferred_location
  hourly_rate
  hourly_rate_currency
  hide_from_dispatch

  priceFields = ['hourly_rate']

  constructor(engineer) {
    for (const [k, v] of Object.entries(engineer)) {
      this[k] = v
    }
    this.setPriceFields(this)
  }

  setHourlyRate(priceDinero) {
    return this.setPriceField('hourly_rate', priceDinero)
  }
}

Object.assign(EngineerModel.prototype, priceMixin);

class EngineerService extends BaseModel {
  // TODO: remove this and use model
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
      'contract_hours_week': 38.0,
      'latest_event': false,
      'preferred_location': null,
      'hourly_rate': '0.00',
      'hourly_rate_currency': 'EUR',

      // 'uses_time_registration': false
    }
  }

  url = '/company/engineer/'

  stats_quarter(pk, year) {
    return this.axios.get(`${this.url}${pk}/stats_quarter/?year=${year}`).then((response) => response.data)
  }

  stats_week(pk, start_date) {
    return this.axios.get(`${this.url}${pk}/stats_week/?start_date=${start_date}`).then((response) => response.data)
  }

  stats_v2_week(pk, start_date, data_mode) {
    const params = [
      'date_query_mode=week',
      `start_date=${start_date}`,
      `data_mode=${data_mode}`
    ]
    return this.axios.get(`${this.url}${pk}/stats_week_v2/?${params.join('&')}`).then((response) => response.data)
  }

  stats_v2_month(pk, month, year, data_mode) {
    const params = [
      'date_query_mode=month',
      `month=${month}`,
      `year=${year}`,
      `data_mode=${data_mode}`
    ]
    return this.axios.get(`${this.url}${pk}/stats_week_v2/?${params.join('&')}`).then((response) => response.data)
  }

  stats_v2_quarter(pk, year, data_mode) {
    const params = [
      'date_query_mode=quarter',
      `year=${year}`,
      `data_mode=${data_mode}`
    ]
    return this.axios.get(`${this.url}${pk}/stats_week_v2/?${params.join('&')}`).then((response) => response.data)
  }

  stats_v2_year(pk, year, data_mode) {
    const params = [
      'date_query_mode=year',
      `year=${year}`,
      `data_mode=${data_mode}`
    ]
    return this.axios.get(`${this.url}${pk}/stats_week_v2/?${params.join('&')}`).then((response) => response.data)
  }
}

export default new EngineerService()
export { EngineerUserModel, RateEngineerUserModel }
