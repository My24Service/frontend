import moment from 'moment'
import BaseModel from '@/models/base'

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
    'required_users': 1,
    'statusses': [],
    'orderlines': [],
    'infolines': [],
    'workorder_documents': [],

    // used in maintenance orders for display
    'product_name': '',
    'brand': '',
    'amount': '',
    'times_per_year': 0,
    'installation_date': '',
    'production_date': '',
    'serialnumber': '',
    'contract_value': 0.00,
    'standard_hours': 0,
    'maintenanceproduct_relation': null,
    'workorder_pdf_url': '',
    'workorder_pdf_url_partner': ''
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
    } else if (this.queryMode == 'inprogress') {
      base = '/order/order/dispatch_list_inprogress/'
    } else if (this.queryMode == 'finished') {
      base = '/order/order/dispatch_list_finished/'
    } else if (this.queryMode == 'unassigned') {
      base = '/order/order/dispatch_list_unassigned/'
    } else if (this.queryMode == 'range') {
      base = '/order/order/get_within_range/'
    } else if (this.queryMode == 'all') {
      base = '/order/order/'
    } else {
      console.log(`unknown queryMode: ${this.queryMode}`)
      base = '/order/order/'
    }

    return base
  }

  search(query) {
    return new Promise((resolve, reject) => {
      this.axios.get(`${this.url}autocomplete/?q=${query}`)
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        reject(error)
      })
    })
  }
}

let orderModel = new Order()

export default orderModel
