import BaseModel from '../base'

class LocationModel {
  customer
  branch
  name
  building
  created
  modified
}

class LocationService extends BaseModel {
  fields = {
    'customer': null,
    'branch': null,
    'name': null,
    'building': null,
    'created': null,
    'modified': null,
  }

  url = '/equipment/location/'

  recreateQr(pk) {
    return this.axios.post(`${this.url}${pk}/create_qr/`)
      .then((response) => response.data)
  }

  searchCustomer(query, customerPk) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}&customer=${customerPk}`)
      .then((response) => response.data)
  }

  searchBranch(query, branchPk) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}&branch=${branchPk}`)
      .then((response) => response.data)
  }

  searchBranchEmployee(query) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`)
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

  listForSelectBranch(branch) {
    return this.axios.get(`${this.url}list_for_select/?branch=${branch}`)
      .then((response) => response.data)
  }

  listForSelectCustomer(customer) {
    return this.axios.get(`${this.url}list_for_select/?customer=${customer}`)
      .then((response) => response.data)
  }

  getExportUrl() {
    let listArgs = []

    if (this.searchQuery) {
      listArgs.push(`q=${this.searchQuery}`)
    }

    return `/api/equipment/location-export-qr/?${listArgs.join('&')}`
  }
}

const locationService = new LocationService()

export default locationService
export { LocationService, LocationModel }
