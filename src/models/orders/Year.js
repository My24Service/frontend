import BaseModel from '@/models/base'
import my24 from '@/services/my24'


class Year extends BaseModel {
  fields = {}

  url = '/order/order/year_list/'

  async getYearData(statuscodes) {
    const results = await this.list()
    const yearData = results.year_data
    const statusesData = results.statuses_data

    // add status color to statuses
    for (const [month, data] of Object.entries(statusesData)) {
      for (const [statuscode, _data] of Object.entries(data['statuscodes'])) {
        statusesData[month]['statuscodes'][statuscode]['color'] = my24.status2color(statuscodes, statuscode)
      }
    }

    return {
      statusesData,
      yearData
    }
  }
}

let yearModel = new Year()

export default yearModel
