import BaseModel from '@/models/base'


class MaterialEvent extends BaseModel {
  fields = {
    'material': null,
    'event_dts': null,
    'event_type': null,
    'created': null,
  }

  url = '/inventory/materialevent/'

  getForMaterial(material) {
    return this.axios.get(`${this.url}?material=${material}`).then((response) => response.data.results)
  }

  async sendDoorOpen(material_id) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const body = {
      'material': material_id,
      'event_type': 'door open',
    }

    return this.axios.post(this.url, body, headers).then((response) => response.data)

  }

  async sendDoorClose(material_id) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    const body = {
      'material': material_id,
      'event_type': 'door close',
    }

    return this.axios.post(this.url, body, headers).then((response) => response.data)

  }
}

let materialEventModel = new MaterialEvent()

export default materialEventModel
