import BaseModel from '../base';


class TimeRegistration extends BaseModel {
  url = '/company/time-registration/'

  getTopUsersForCustomerView(customer_pk) {
    const url = `${this.url}top-users-for-customer/?customer=${customer_pk}`
    return this.axios.get(url).then((response) => response.data)
  }

}

let timeRegistrationModel = new TimeRegistration();

export default timeRegistrationModel;
