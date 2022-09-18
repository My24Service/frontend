import BaseModel from '@/models/base'
import my24 from '@/services/my24'


class Month extends BaseModel {
  fields = {}

  url = '/order/order/month_list/'

  getMonthData(statuscodes) {
    return this.list().then((results) => {
      const monthData = results.month_data
      const statusesData = results.statuses_data
      const assignedOrdersData = results.assigned_orders_data

      // add status color to statuses
      for (const [week, data] of Object.entries(statusesData)) {
        for (const [statuscode, _data] of Object.entries(data['items'])) {
          statusesData[week]['items'][statuscode]['color'] = my24.status2color(statuscodes, statuscode)
        }
      }

      return {
        monthData,
        statusesData,
        assignedOrdersData
      }
    })
  }
}

let monthModel = new Month()

export default monthModel
