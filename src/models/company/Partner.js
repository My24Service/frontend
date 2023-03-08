import BaseModel from '../base'


class Partner extends BaseModel {
  fields = {
    'partner': 0,
    'partner_view': {},
    'active': true,
    'member_data': [],
  }

  url = '/company/partner/'

  getBranches(partnerPk) {
    const url = `${this.getListUrl()}${partnerPk}/branches/`
    return this.axios.get(url).then((response) => response.data)
  }

  createBranchFromCustomer(customerPk, partnerPk) {
    const data = {
      customer_id: customerPk
    }

    const url = `${this.url}${partnerPk}/branch_create_from_customer/`
    return this.axios.post(url, data).then((response) => response.data)
  }

  copy_customer_orders(customerPk, partnerPk) {
    const data = {
      customer_id: customerPk
    }

    const url = `${this.url}${partnerPk}/copy_customer_orders/`
    return this.axios.post(url, data).then((response) => response.data)
  }

}

let partnerModel = new Partner()

export default partnerModel
