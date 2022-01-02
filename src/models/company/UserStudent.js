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
      'bsn': ''
    }
  }

  url = '/company/studentuser/'

  setInActive(token, pk, email) {
    const data = {
      email,
      'student_user': {},
      'is_active': false
    }

    return new Promise((resolve, reject) => {
      this.update(token, pk, data).then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
    })
  }

  setActive(token, pk, email) {
    const data = {
      email,
      'student_user': {},
      'is_active': true
    }

    return new Promise((resolve, reject) => {
      this.update(token, pk, data).then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
    })
  }
}

let studentUserModel = new StudentUser()

export default studentUserModel
