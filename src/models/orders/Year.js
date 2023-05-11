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
      for (const [statuscode, _data] of Object.entries(data['items'])) {
        statusesData[month]['items'][statuscode]['color'] = my24.status2color(statuscodes, statuscode)
      }
    }

    return {
      statusesData,
      yearData
    }
  }

  async getOrderTypesStats(customerPk) {
    const url = `/order/order/order_types_stats/?customer=${customerPk}`

    const response = await this.axios.get(url)
    return response.data.order_types_stats

  }

  async getMonthsStats(customerPk) {
    const url = `/order/order/order_counts_stats/?customer=${customerPk}`

    const response = await this.axios.get(url)
    return response.data.order_counts_stats

  }

  async getOrderTypesMonthsStats(customerPk) {
    const url = `/order/order/order_types_month_stats/?customer=${customerPk}`

    const response = await this.axios.get(url)
    return response.data.order_types_month_stats

  }
}

let yearModel = new Year()

export default yearModel
