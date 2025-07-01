import BaseModel from '../base';


class TimeRegistrationService extends BaseModel {
  url = '/company/time-registration/'

  getTopUsersForCustomerView(customer_pk) {
    const url = `${this.url}top-users-for-customer/?customer=${customer_pk}`
    return this.axios.get(url).then((response) => response.data)
  }

  editCorrection(pk, data) {
    const url = `${this.url}time-correction/${pk}/`;
    return this.axios.patch(url, data).then((response) => response.data)
  }
}

let timeRegistrationModel = new TimeRegistrationService();

export default timeRegistrationModel;
export { TimeRegistrationService }
