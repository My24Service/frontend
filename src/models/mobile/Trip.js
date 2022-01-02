import moment from 'moment';
import BaseModel from '@/models/base';


class Trip extends BaseModel {
  fields = {
    'description': '',
    'required_users': '',
    'last_status': '',
    'last_status_full': '',
    'start_location_from_first_order': false,
    'start_datetime_from_first_order': false,
    'start_name': '',
    'start_address': '',
    'start_postal': '',
    'start_city': '',
    'start_country_code': 'NL',
    'end_location_from_last_order': true,
    'end_datetime_from_last_order': true,
    'end_name': '',
    'end_address': '',
    'end_postal': '',
    'end_city': '',
    'end_country_code': 'NL',
    'start_date': null,
    'start_time': null,
    'end_date': null,
    'end_time': null,
    'user_trip_is_available': true,
    'trip_orders': [],
  }

  url = '/mobile/trip/'

  preInsert(trip) {
    // check date types
    if (typeof trip.start_date === 'object') {
      trip.start_date = moment(trip.start_date).format('YYYY-MM-DD');
    }

    if (typeof trip.end_date === 'object') {
      trip.end_date = moment(trip.end_date).format('YYYY-MM-DD');
    }

    return trip;
  }

  preUpdate(trip) {
    // check date types
    if (typeof trip.start_date === 'object') {
      trip.start_date = moment(trip.start_date).format('YYYY-MM-DD');
    }

    if (typeof trip.end_date === 'object') {
      trip.end_date = moment(trip.end_date).format('YYYY-MM-DD');
    }

    return trip;
  }

}

const tripModel = new Trip();

export default tripModel;
