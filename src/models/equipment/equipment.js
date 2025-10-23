import BaseModel from '../base'
import priceMixin from "../../mixins/price";

class EquipmentModel {
  customer
  branch
  location
  name
  brand
  identifier
  description
  installation_date
  production_date
  serialnumber
  standard_hours
  default_replace_months
  latest_state
  price
  price_currency
  created
  modified

  priceFields = ['price']

  constructor(equipment) {
    for (const [k, v] of Object.entries(equipment)) {
      this[k] = v
    }
    this.setPriceFields(this)
  }
}

Object.assign(EquipmentModel.prototype, priceMixin);

class EquipmentService extends BaseModel {
  model = EquipmentModel
  fields = {
    'customer': null,
    'branch': null,
    'location': null,
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
    'documents': []
  }

  url = '/equipment/equipment/'

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

  getExportUrl() {
    let listArgs = []

    if (this.searchQuery) {
      listArgs.push(`q=${this.searchQuery}`)
    }

    return `/api/equipment/equipment-export-qr/?${listArgs.join('&')}`
  }
}

const equipmentService = new EquipmentService()

export default equipmentService
export  {EquipmentModel, EquipmentService}
