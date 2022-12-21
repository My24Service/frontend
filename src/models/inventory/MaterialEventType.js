import BaseModel from '@/models/base'


class MaterialEventType extends BaseModel {
  fields = {
    'id': null,
    'event_type': null,
    'measure_last_event_type': null,
  }

  url = '/inventory/material-event-type/'

  getStatsForMaterial(material) {
    return this.axios.get(`${this.url}stats/?material=${material}`).then((response) => response.data)
  }
}

let materialEventTypeModel = new MaterialEventType()

export default materialEventTypeModel
