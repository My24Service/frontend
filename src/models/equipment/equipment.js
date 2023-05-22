import BaseModel from '../base'

class Equipment extends BaseModel {
  fields = {
    'customer': null,
    'branch': null,

    'name': null,
    'brand': null,
    'identifier': null,
    'description': null,
    'installation_date': null,
    'production_date': null,
    'serialnumber': null,
    'standard_hours': null,
    'created': null,
    'modified': null,
  }

  url = '/equipment/equipment/'

  searchCustomer(query, customerPk) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}&customer=${customerPk}`)
      .then((response) => response.data)
  }

  searchBranch(query, branchPk) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}&branch=${branchPk}`)
      .then((response) => response.data)
  }

  quickAddCustomerPlanning(name, customerPk) {
    const data = {
      customer: customerPk,
      name
    }

    return this.axios.post(`${this.url}create_quick/`, data).then(response => response.data)
  }

  quickAddBranchPlanning(name, branchPk) {
    const data = {
      branch: branchPk,
      name
    }

    return this.axios.post(`${this.url}create_quick/`, data).then(response => response.data)
  }

  quickAddCustomerNonPlanning(name) {
    const data = {
      customer: 0,
      name
    }

    return this.axios.post(`${this.url}create_quick/`, data).then(response => response.data)
  }

  quickAddBranchNonPlanning(name) {
    const data = {
      branch: 0,
      name
    }

    return this.axios.post(`${this.url}create_quick/`, data).then(response => response.data)
  }
}

const equipmentModel = new Equipment()

export default equipmentModel
