import BaseModel from '../base'

class Building extends BaseModel {
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

  listForSelect() {
    return this.axios.get(`${this.url}list_for_select/`)
      .then((response) => response.data)
  }
}

const buildingModel = new Building()

export default buildingModel
