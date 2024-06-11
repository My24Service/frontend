import BaseModel from '../base'

class EquipmentImport {
  id
  file
  mapping
  filter_on
  result_inserts

  constructor(data) {
    for (const [k, v] of Object.entries(data)) {
      this[k] = v
    }
  }
}

class EquipmentImportService extends BaseModel {
  url = '/company/import/'

  fetchAllowedExtensions(pk) {
    return this.axios.get(`${this.url}get_allowed_extensions/`).then((response) => response.data)
  }

  fetchRequired() {
    return this.axios.get(`${this.url}required/`).then((response) => response.data)
  }

  previewImport(pk) {
    return this.axios.get(`${this.url}${pk}/preview/`).then((response) => response.data)
  }

  doImport(pk) {
    return this.axios.post(`${this.url}${pk}/do_import/`).then((response) => response.data)
  }
}

const testData = {"customers": [], "branches": [{"id": 300, "name": "Fictie B.V.", "address": "Straat 1", "postal": "1234AA", "city": "Amsterdam", "country_code": "NL", "tel": "06123456789", "email": null, "contact": "Donald", "mobile": null, "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "num_orders": null, "import_created": true}], "equipment": [{"id": 7084, "uuid": "6b005dd1-698a-4ce2-905f-37be47df7288", "customer": null, "branch": 300, "customer_branch_view": {"id": 300, "name": "Fictie B.V.", "address": "Straat 1", "postal": "1234AA", "city": "Amsterdam", "country_code": "NL", "tel": "06123456789", "email": null, "contact": "Donald", "mobile": null, "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "num_orders": null}, "location": 839, "location_name": "Dock 1", "name": "Deur 1", "brand": null, "identifier": null, "description": null, "installation_date": "2024-06-10", "production_date": null, "serialnumber": null, "standard_hours": null, "default_replace_months": 0, "latest_state": null, "price": "0.00", "price_currency": "EUR", "qr_path": null, "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "num_orders": null, "import_created": true}, {"id": 7085, "uuid": "1e11b410-09d2-4638-8048-0fab24ef7e06", "customer": null, "branch": 300, "customer_branch_view": {"id": 300, "name": "Fictie B.V.", "address": "Straat 1", "postal": "1234AA", "city": "Amsterdam", "country_code": "NL", "tel": "06123456789", "email": null, "contact": "Donald", "mobile": null, "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "num_orders": null}, "location": 840, "location_name": "Dock 2", "name": "Deur 2", "brand": null, "identifier": null, "description": null, "installation_date": "2024-06-10", "production_date": null, "serialnumber": null, "standard_hours": null, "default_replace_months": 0, "latest_state": null, "price": "0.00", "price_currency": "EUR", "qr_path": null, "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "num_orders": null, "import_created": true}], "locations": [{"id": 839, "customer": null, "customer_branch_view": {"id": 300, "name": "Fictie B.V.", "address": "Straat 1", "postal": "1234AA", "city": "Amsterdam", "country_code": "NL", "tel": "06123456789", "email": null, "contact": "Donald", "mobile": null, "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "num_orders": null}, "branch": 300, "building": null, "qr_path": null, "name": "Dock 1", "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "import_created": true}, {"id": 840, "customer": null, "customer_branch_view": {"id": 300, "name": "Fictie B.V.", "address": "Straat 1", "postal": "1234AA", "city": "Amsterdam", "country_code": "NL", "tel": "06123456789", "email": null, "contact": "Donald", "mobile": null, "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "num_orders": null}, "branch": 300, "building": null, "qr_path": null, "name": "Dock 2", "created": "10/06/2024 18:43", "modified": "10/06/2024 18:43", "import_created": true}]}

export {EquipmentImport, EquipmentImportService, testData}
