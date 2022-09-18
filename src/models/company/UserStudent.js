import BaseModel from '@/models/base'


class StudentUser extends BaseModel {
  fields = {
    'username': '',
    'first_name': '',
    'last_name': '',
    'email': '',
    'password1': '',
    'password2': '',
    'password': '',
    'student_user': {
      'street': '',
      'house_number': '',
      'house_number_addition': '',
      'postal': '',
      'city': '',
      'country_code': 'NL',
      'mobile': '',
      'remarks': '',
      'picture': '',
      'info': '',
      'rating': null,
      'lon': null,
      'lat': null,
      'iban': '',
      'gender': 'M',
      'dob': '',
      'drivers_licence': 'N',
      'drivers_licence_type': '',
      'box_truck': 'N',
      'bsn': '',
      'uses_time_registration': false,
      'contract_hours_week': 0.0
    }
  }

  url = '/company/studentuser/'

  setInActive(pk, email) {
    const data = {
      email,
      'student_user': {},
      'is_active': false
    }

    return this.update(pk, data)
  }

  setActive(pk, email) {
    const data = {
      email,
      'student_user': {},
      'is_active': true
    }

    return this.update(pk, data)
  }
}

let studentUserModel = new StudentUser()

export default studentUserModel
