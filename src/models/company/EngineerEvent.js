import BaseModel from '../../models/base'

class EngineerEvent extends BaseModel {
  fields = {
    'engineer': null,
    'event_dts': null,
    'event_type': null,
    'created': null,
  }

  url = '/company/engineerevent/'

  getForEngineer(engineer) {
    return this.axios.get(`${this.url}?engineer=${engineer}`).then((response) => response.data.results)
  }

  async sendDoorOpen(engineer_id, event_dts) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    let body = {
      'engineer': engineer_id,
      'event_type': 'door open',
    }

    if (event_dts) {
      body['event_dts'] = event_dts
    }

    return this.axios.post(this.url, body, headers).then((response) => response.data)

  }

  async sendDoorClosed(engineer_id, event_dts) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)
    let body = {
      'engineer': engineer_id,
      'event_type': 'door closed',
    }

    if (event_dts) {
      body['event_dts'] = event_dts
    }

    return this.axios.post(this.url, body, headers).then((response) => response.data)

  }
}

let engineerEventModel = new EngineerEvent()

export default engineerEventModel
