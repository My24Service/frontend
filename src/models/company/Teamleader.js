import client from '@/services/api'
import BaseModel from "@/models/base";

class TeamleaderService extends BaseModel{
  axios = client
  base_url = 'teamleader'

  async configDetail() {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/config/`

    return this.axios.get(url, headers).then(response => response.data)
  }

  async checkTokens() {
    const data = {}

    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/check-tokens/`

    return this.axios.post(url, data, headers).then(response => response.data)
  }

  async emptyTokens() {
    const data = {}

    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/empty-tokens/`

    return this.axios.post(url, data, headers).then(response => response.data)
  }

  async updateDocumentTemplateSetting(templateUuid) {
    const data = {
      template_uuid: templateUuid
    }

    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const url = `${this.base_url}/update-document-template/`

    return this.axios.patch(url, data, headers).then(response => response.data)
  }

  async updateDepartmentSetting(departmentUuid) {
    const data = {
      department_uuid: departmentUuid
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

}

export {TeamleaderService}
