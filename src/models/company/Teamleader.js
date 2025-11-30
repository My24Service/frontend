import client from '@/services/api'
import BaseModel from "@/models/base";

class TeamleaderService extends BaseModel{
  axios = client
  base_url = 'teamleader'

  async oauthPost(code, state) {
    const data = { code, state }
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/oauth/`

    return this.axios.post(url, data, headers).then(response => response.data)
  }

  async configDetail() {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/config/`

    return this.axios.get(url, headers).then(response => response.data)
  }

  async departmentList() {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/department/`

    return this.axios.get(url, headers).then(response => response.data)
  }

  async invoiceDocumentTemplateList(id) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/invoice-document-template/?department_id=${id}`

    return this.axios.get(url, headers).then(response => response.data)
  }

  async authorize() {
    const data = {}

    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/authorize/`

    return this.axios.post(url, data, headers).then(response => response.data)
  }

  async emptyTokens() {
    const data = {}

    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/empty-tokens/`

    return this.axios.post(url, data, headers).then(response => response.data)
  }

  async updateInvoiceDocumentTemplateSetting(templateUuid, name) {
    const data = {
      invoice_template_uuid: templateUuid,
      invoice_template_name: name
    }

    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/update-invoice-document-template/`

    return this.axios.patch(url, data, headers).then(response => response.data)
  }

  async updateDepartmentSetting(departmentUuid, name) {
    const data = {
      department_uuid: departmentUuid,
      department_name: name,
    }

    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/update-department/`

    return this.axios.patch(url, data, headers).then(response => response.data)
  }

  async updateEnabled(enabled) {
    const data = {
      'api_enabled': enabled
    }

    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/update-enabled/`

    return this.axios.patch(url, data, headers).then(response => response.data)
  }

  async fetchTaxRates() {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/tax-rate/`

    return this.axios.get(url, headers).then(response => response.data)
  }

  async resetTaxRates(department_id) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/tax-rate-reset/?department_id=${department_id}`

    return this.axios.post(url, {}, headers).then(response => response.data)
  }
}

export {TeamleaderService}
