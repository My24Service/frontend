import client from '@/services/api'
import BaseModel from "@/models/base";

class TeamleaderService extends BaseModel{
  axios = client
  base_url = 'teamleader'

  async oauthPost(code, state) {
    const data = { code, state }
    const url = `${this.base_url}/oauth/`

    return this.axios.post(url, data).then(response => response.data)
  }

  async configDetail() {
    const url = `${this.base_url}/config/`

    return this.axios.get(url).then(response => response.data)
  }

  async departmentList() {
    const url = `${this.base_url}/department/`

    return this.axios.get(url).then(response => response.data)
  }

  async invoiceDocumentTemplateList() {
    const url = `${this.base_url}/invoice-document-template/`

    return this.axios.get(url).then(response => response.data)
  }

  async authorize() {
    const data = {}
    const url = `${this.base_url}/authorize/`

    return this.axios.post(url, data).then(response => response.data)
  }

  async emptyTokens() {
    const data = {}
    const url = `${this.base_url}/empty-tokens/`

    return this.axios.post(url, data).then(response => response.data)
  }

  async checkTokens() {
    const data = {}
    const url = `${this.base_url}/check-tokens/`

    return this.axios.post(url, data).then(response => response.data)
  }

  async updateInvoiceDocumentTemplateSetting(templateUuid, name) {
    const data = {
      invoice_template_uuid: templateUuid,
      invoice_template_name: name
    }
    const url = `${this.base_url}/update-invoice-document-template/`

    return this.axios.patch(url, data).then(response => response.data)
  }

  async updateDepartmentSetting(departmentUuid, name) {
    const data = {
      department_uuid: departmentUuid,
      department_name: name,
    }
    const url = `${this.base_url}/update-department/`

    return this.axios.patch(url, data).then(response => response.data)
  }

  _getPriceJsonObj(priceObj) {
    if (priceObj) {
      return {
        price: priceObj.amount,
        currency: priceObj.currency,
      }
    }

    return {
      price: null,
      currency: null,
    }
  }

  async updateWorkHoursProduct(id, name, purchasePriceObj, sellingPriceObj) {
    const jsonPricePurchase = this._getPriceJsonObj(purchasePriceObj)
    const jsonPriceSelling = this._getPriceJsonObj(sellingPriceObj)
    const data = {
      workhours_product_uuid: id,
      workhours_product_name: name,
      workhours_product_purchase_price: jsonPricePurchase.amount,
      workhours_product_purchase_price_currency: jsonPricePurchase.currency,
      workhours_product_selling_price: jsonPriceSelling.amount,
      workhours_product_selling_price_currency: jsonPriceSelling.currency
    }
    const url = `${this.base_url}/work-hours-product/`

    return this.axios.patch(url, data).then(response => response.data)
  }

  async updateTravelHoursProduct(id, name, purchasePriceObj, sellingPriceObj) {
    const jsonPricePurchase = this._getPriceJsonObj(purchasePriceObj)
    const jsonPriceSelling = this._getPriceJsonObj(sellingPriceObj)
    const data = {
      travel_hours_product_uuid: id,
      travel_hours_product_name: name,
      travel_hours_product_purchase_price: jsonPricePurchase.amount,
      travel_hours_product_purchase_price_currency: jsonPricePurchase.currency,
      travel_hours_product_selling_price: jsonPriceSelling.amount,
      travel_hours_product_selling_price_currency: jsonPriceSelling.currency
    }
    const url = `${this.base_url}/travel-hours-product/`

    return this.axios.patch(url, data).then(response => response.data)
  }

  async updateEnabled(enabled) {
    const data = {
      'api_enabled': enabled
    }

    const url = `${this.base_url}/update-enabled/`

    return this.axios.patch(url, data).then(response => response.data)
  }

  async fetchTaxRates() {
    const url = `${this.base_url}/tax-rate/`

    return this.axios.get(url).then(response => response.data)
  }

  async resetTaxRates() {
    const url = `${this.base_url}/tax-rate-reset/`

    return this.axios.post(url, {}).then(response => response.data)
  }

  async fetchProductCategories() {
    const url = `${this.base_url}/product-category/`

    return this.axios.get(url).then(response => response.data)
  }

  async resetProductCategories() {
    const url = `${this.base_url}/product-category-reset/`

    return this.axios.post(url, {}).then(response => response.data)
  }

  async updateProductCategory(product_category_uuid) {
    const data = {
      product_category_uuid
    }
    console.log({data})

    const url = `${this.base_url}/update-product-category/`

    return this.axios.patch(url, data).then(response => response.data)
  }

  async fetchBusinessTypes() {
    const url = `${this.base_url}/business-type-list/`

    return this.axios.get(url).then(response => response.data)
  }


  async fetchProducts(query) {
    let url = `${this.base_url}/product-list/`
    if (query) {
      url = `${url}?query=${query}`
    }

    return this.axios.get(url).then(response => response.data)
  }

  async fetchProductDetail(id) {
    let url = `${this.base_url}/product-detail/?id=${id}`

    return this.axios.get(url).then(response => response.data)
  }

  async fetchTeamleaderProducts(query) {
    let url = `${this.base_url}/tl-product-list/`
    if (query) {
      url = `${url}?query=${query}`
    }

    return this.axios.get(url).then(response => response.data)
  }
}

export {TeamleaderService}
