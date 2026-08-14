import BaseModel from '../base'

// Mirrors the Django `Building` model: `name` is a required CharField, while
// `customer`/`branch` are nullable FKs (serialized as PKs) and `created`/
// `modified` come from TimeStampedModel as ISO datetimes.
class BuildingModel {
  name: string = ''
  customer: number | null = null
  branch: number | null = null
  created: string | null = null
  modified: string | null = null
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

  searchCustomer(query: string, customerPk: string | number) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}&customer=${customerPk}`)
      .then((response) => response.data)
  }

  searchBranch(query: string, branchPk: string | number) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}&branch=${branchPk}`)
      .then((response) => response.data)
  }

  searchBranchEmployee(query: string) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`)
      .then((response) => response.data)
  }

  listForSelectBranch(branch: string | number) {
    return this.axios.get(`${this.url}list_for_select/?branch=${branch}`)
      .then((response) => response.data)
  }

  listForSelectCustomer(customer: string | number) {
    return this.axios.get(`${this.url}list_for_select/?customer=${customer}`)
      .then((response) => response.data)
  }
}

const buildingService = new BuildingService()

export default buildingService
export { BuildingService, BuildingModel }
