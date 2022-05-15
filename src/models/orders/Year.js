import BaseModel from '@/models/base'
import my24 from '@/services/my24'


class Year extends BaseModel {
  fields = {}

  url = '/order/order/year_list/'

  getYearData(statuscodes) {
    return this.list().then((yearData) => {
      let results = []

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

        results.push({
          name: yearData[i].name,
          months: months
        });
      }

      return results
    })
  }
}

let yearModel = new Year()

export default yearModel
