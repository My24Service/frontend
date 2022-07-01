import BaseModel from '@/models/base'
import my24 from '@/services/my24'


class Month extends BaseModel {
  fields = {}

  url = '/order/order/month_list/'

  getMonthData(statuscodes) {
    return this.list().then((results) => {
      const monthData = results.week_data
      const statusesData = results.statuses_data
      let weekObjs = {}

      // add status color to orders
      for (let i = 0; i < monthData.length; i++) {
        for (const [week, data] of Object.entries(monthData[i].weeks)) {
          for (let j = 0; j < data.length; j++) {
            monthData[i].weeks[week][j].color = my24.status2color(statuscodes, data[j].status)
          }

          if (!(week in weekObjs)) {
            weekObjs[week] = 1
          }
        }
      }

      // add status color to statuses
      for (const [week, data] of Object.entries(statusesData)) {
        for (const [statuscode, _data] of Object.entries(data['statuscodes'])) {
          statusesData[week]['statuscodes'][statuscode]['color'] = my24.status2color(statuscodes, statuscode)
        }
      }

      let weeks = []
      for (const [week, _] of Object.entries(weekObjs)) {
        weeks.push(week)
      }

      return {
        monthData,
        weeks,
        statusesData
      }
    })
  }
}

let monthModel = new Month()

export default monthModel
