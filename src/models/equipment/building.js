import BaseModel from '../base'

class BuildingModel {
  customer
  branch
  name
  created
  modified
}

class BuildingService extends BaseModel {
  fields = {
    'customer': null,
    'branch': null,
    'name': null,
    'created': null,
    'modified': null,
  }

  url = '/equipment/building/'

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

  listForSelectBranch(branch) {
    return this.axios.get(`${this.url}list_for_select/?branch=${branch}`)
      .then((response) => response.data)
  }

  listForSelectCustomer(customer) {
    return this.axios.get(`${this.url}list_for_select/?customer=${customer}`)
      .then((response) => response.data)
  }
}

const buildingService = new BuildingService()

export default buildingService
export { BuildingService, BuildingModel }
