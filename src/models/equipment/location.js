import BaseModel from '../base'

class Location extends BaseModel {
  fields = {
    'customer': null,
    'branch': null,
    'name': null,
    'identifier': null,
  }

  url = '/equipment/location/'

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

const locationModel = new Location()

export default locationModel
