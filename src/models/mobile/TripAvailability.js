import axios from 'axios';

import BaseModel from '@/models/base';


class TripAvailability extends BaseModel {
  fields = {
    'description': '',
    'required_users': '',
    'start_date': '',
    'start_time': '',
    'end_date': '',
    'end_time': '',
    'user_trip_is_available': true,
    'trip_orders': [],
    'assigned_users': [],
    'available_users': []
  }

  url = '/mobile/user-trip-availability/'

  getDetailUrl(pk) {
    return `/mobile/trip/${pk}/trip_availability_detail/`
  }

  assign(token, user_id, trip_id) {
    const headers = this.getHeaders(token);
    const url = `/mobile/assign-user-trip/${user_id}/`
    const data = {'trip_ids': [ trip_id ].join(','), 'set_unavailable': true}

    return new Promise((resolve, reject) => {
      axios.post(url, data, headers)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  unAssign(token, user_id, trip_id) {
    const headers = this.getHeaders(token);
    const url = `/mobile/unassign-user-trip/${user_id}/`
    const data = {trip_pk: trip_id, 'set_available': true}

    return new Promise((resolve, reject) => {
      axios.post(url, data, headers)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

}

const tripAvailabilityModel = new TripAvailability();

export default tripAvailabilityModel;
