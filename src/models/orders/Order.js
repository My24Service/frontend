import moment from 'moment'
import BaseModel from '../base'

let tomorrow = moment().add(1, 'days')

// sunday
if (tomorrow.day() === 0) {
  tomorrow = tomorrow.add(1, 'days')
}

// saturday
if (tomorrow.day() === 6) {
  tomorrow = tomorrow.add(2, 'days')
}


class Order extends BaseModel {
  fields = {
    'customer_id': '',
    'order_name': '',
    'order_address': '',
    'order_postal': '',
    'order_city': '',
    'order_country_code': 'NL',
    'customer_relation': null,
    'order_type': null,
    'order_reference': '',
    'order_tel': '',
    'order_mobile': '',
    'order_email': '',
    'order_contact': '',
    'service_number': '',
    'location': '',
    'start_date': tomorrow.toDate(),
    'start_time': null,
    'end_date': tomorrow.toDate(),
    'end_time': null,
    'order_date': '',
    'customer_remarks': '',
    'remarks': '',
    'required_users': 1,
    'statuses': [],
    'orderlines': [],
    'infolines': [],
    'workorder_documents': [],

    'workorder_pdf_url': '',
    'workorder_pdf_url_partner': '',

    'reported_codes_extra_data': [],
  }

  url = '/order/order/'
  queryMode = 'all'

  postCopyFields(fields) {
    fields.start_date = tomorrow.toDate()
    fields.end_date = tomorrow.toDate()
    return fields
  }

  recreateWorkorderPdf(pk) {
    return this.axios.post(`${this.url}${pk}/recreate_pdf/`)
  }

  recreateWorkorderPdfGotenberg(pk) {
    return this.axios.post(`${this.url}${pk}/recreate_pdf/?gotenberg=1`)
  }

  preInsert(order) {
    // check date types
    if (typeof order.start_date === 'object') {
      order.start_date = moment(order.start_date).format('YYYY-MM-DD')
    }

    if (typeof order.end_date === 'object') {
      order.end_date = moment(order.end_date).format('YYYY-MM-DD')
    }

    return order
  }

  preUpdate(order) {
    // check date types
    if (typeof order.start_date === 'object') {
      order.start_date = moment(order.start_date).format('YYYY-MM-DD')
    }

    if (typeof order.end_date === 'object') {
      order.end_date = moment(order.end_date).format('YYYY-MM-DD')
    }

    return order
  }

  getListUrl() {
    let base = ''
    if (this.queryMode === 'dispatch') {
      base = '/order/order/dispatch_list_all/'
    } else if (this.queryMode === 'inprogress') {
      base = '/order/order/dispatch_list_inprogress/'
    } else if (this.queryMode === 'finished') {
      base = '/order/order/dispatch_list_finished/'
    } else if (this.queryMode === 'unassigned') {
      base = '/order/order/dispatch_list_unassigned/'
    } else if (this.queryMode === 'range') {
      base = '/order/order/get_within_range/'
    } else if (this.queryMode === 'all') {
      base = '/order/order/'
    } else {
      console.log(`unknown queryMode: ${this.queryMode}`)
      base = '/order/order/'
    }

    return base
  }

  search(query) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then(response => response.data)
  }

  getWorkorderData(uuid) {
    return this.axios.get(`/order/workorder-data/${uuid}/`).then(response => response.data)
  }


  async getOrderTypesStats(customerPk) {
    const url = customerPk ? `${this.url}order_types_stats/?customer=${customerPk}` : `${this.url}order_types_stats/`

    const response = await this.axios.get(url)
    return response.data.order_types_stats
  }

  async getOrderTypesMonthsStats(customerPk) {
    const url = customerPk ? `${this.url}order_types_month_stats/?customer=${customerPk}` : `${this.url}order_types_month_stats/`

    const response = await this.axios.get(url)
    return response.data.order_types_month_stats
  }

  async getMonthsStats(customerPk) {
    const url = customerPk ? `${this.url}order_counts_stats/?customer=${customerPk}` : `${this.url}order_counts_stats/`

    const response = await this.axios.get(url)
    return response.data.order_counts_stats
  }

  async getCountsYearOrdertypeStats(customerPk) {
    const url = customerPk ? `${this.url}counts_year_order_type_stats/?customer=${customerPk}` : `${this.url}counts_year_order_type_stats/`
    const response = await this.axios.get(url)
    return response.data.counts_year_order_type_stats
  }

  async getTopXCustomers() {
    const response = await this.axios.get(`${this.url}get_top_x_customers/`)
    return response.data.get_top_x_customers
  }
}

let orderModel = new Order()

export default orderModel
