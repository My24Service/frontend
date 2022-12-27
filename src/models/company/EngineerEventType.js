import BaseModel from '../../models/base'

class EngineerEventType extends BaseModel {
  fields = {
    'id': null,
    'event_type': null,
    'measure_last_event_type': null,
  }

  url = '/company/engineer-event-type/'

  getStatsForEngineer(engineer) {
    return this.axios.get(`${this.url}stats/?engineer=${engineer}`).then((response) => response.data)
  }
}

let engineerEventTypeModel = new EngineerEventType()

export default engineerEventTypeModel
