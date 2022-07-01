import BaseModel from '@/models/base'
import my24 from '@/services/my24'


class Year extends BaseModel {
  fields = {}

  url = '/order/order/year_list/'

  async getYearData(statuscodes) {
    const results = await this.list()
    const yearData = results.year_data
    const statusesData = results.statuses_data

    let resultYearData = []

    // add status color to orders
    for (let i=0; i<yearData.length; i++) {
      let months = []

      for (let month = 1; month <= 12; month++) {
        if (month in yearData[i].months) {
          for (let j = 0; j < yearData[i].months[month].length; j++) {
            yearData[i].months[month][j].color = my24.status2color(statuscodes, yearData[i].months[month][j].status)
          }
        }

        months.push(yearData[i].months[month])
      }

      resultYearData.push({
        name: yearData[i].name,
        months: months
      });
    }

    // add status color to statuses
    for (const [month, data] of Object.entries(statusesData)) {
      for (const [statuscode, _data] of Object.entries(data['statuscodes'])) {
        statusesData[month]['statuscodes'][statuscode]['color'] = my24.status2color(statuscodes, statuscode)
      }
    }

    return {
      statusesData,
      resultYearData
    }
  }
}

let yearModel = new Year()

export default yearModel
