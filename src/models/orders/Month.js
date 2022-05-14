import BaseModel from '@/models/base'
import my24 from '@/services/my24'


class Month extends BaseModel {
  fields = {}

  url = '/order/order/month_list/'

  getMonthData(statuscodes) {
    return this.list().then((monthData) => {
      let results = [], weekObjs = {}

      // add status color to orders
      for (let i = 0; i < monthData.length; i++) {
        for (const [week, data] of Object.entries(monthData[i].weeks)) {
          for (let j = 0; j < data.length; j++) {
            data[j].color = my24.status2color(statuscodes, data[j].status)
          }

          if (!(week in weekObjs)) {
            weekObjs[week] = 1
          }
        }
      }

      let weeks = []
      for (const [week, _] of Object.entries(weekObjs)) {
        weeks.push(week)
      }

      return {
        results: monthData,
        weeks
      }
    })
  }
}

let monthModel = new Month()

export default monthModel
