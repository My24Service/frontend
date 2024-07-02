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

class OrderModel {
  id
  order_id
  customer_id
  order_name
  order_address
  order_postal
  order_city
  order_country_code = 'NL'
  customer_relation
  branch
  order_type
  order_reference
  order_tel
  order_mobile
  order_email
  order_contact
  service_number
  start_date = tomorrow.toDate()
  start_time
  end_date = tomorrow.toDate()
  end_time
  order_date
  customer_remarks
  remarks
  required_users = 1
  statuses = []
  orderlines = []
  infolines = []
  workorder_documents
  customer_order_accepted
  planning_remarks

  workorder_pdf_url
  workorder_pdf_url_partner

  reported_codes_extra_data
}

class OrderService extends BaseModel {
  model = OrderModel
  fields = {
    'customer_id': '',
    'order_name': '',
    'order_address': '',
    'order_postal': '',
    'order_city': '',
    'order_country_code': 'NL',
    'customer_relation': null,
    'branch': null,
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
    // 'visibility': 'private',
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
    'planning_remarks': ''
  }

  url = '/order/order/'
  queryMode = 'all'

  postCopyFields(fields) {
    fields.start_date = tomorrow.toDate()
    fields.end_date = tomorrow.toDate()
    return fields
  }

  recreateWorkorderPdfGotenberg(pk) {
    return this.axios.post(`${this.url}${pk}/recreate_pdf/?gotenberg=1`)
  }

  preInsert(order) {
    delete order.created
    delete order.modified

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
    delete order.created
    delete order.modified

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


  // order types
  async getOrderTypesStatsCustomer(customerPk) {
    const url = customerPk ? `${this.url}order_types_stats/?customer=${customerPk}` : `${this.url}order_types_stats/`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_stats : {}
  }

  async getOrderTypesStatsBranch(branchPk) {
    const url = branchPk ? `${this.url}order_types_stats/?branch=${branchPk}` : `${this.url}order_types_stats/`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_stats : {}
  }

  async getOrderTypesStatsLocation(locationPk) {
    const url = `${this.url}order_types_stats/?location=${locationPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_stats : {}
  }

  async getOrderTypesStatsEquipment(equipmentPk) {
    const url = `${this.url}order_types_stats/?equipment=${equipmentPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_stats : {}
  }

  async getOrderTypesStatsBuilding(buildingPk) {
    const url = `${this.url}order_types_stats/?building=${buildingPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_stats : {}
  }

  // order types month
  async getOrderTypesMonthsStatsCustomer(customerPk) {
    const url = customerPk ? `${this.url}order_types_month_stats/?customer=${customerPk}` : `${this.url}order_types_month_stats/`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_month_stats : {}
  }

  async getOrderTypesMonthsStatsBranch(branchPk) {
    const url = branchPk ? `${this.url}order_types_month_stats/?branch=${branchPk}` : `${this.url}order_types_month_stats/`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_month_stats : {}
  }

  async getOrderTypesMonthsStatsLocation(locationPk) {
    const url = `${this.url}order_types_month_stats/?location=${locationPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_month_stats : {}
  }

  async getOrderTypesMonthsStatsEquipment(equipmentPk) {
    const url = `${this.url}order_types_month_stats/?equipment=${equipmentPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_month_stats : {}
  }

  async getOrderTypesMonthsStatsBuilding(buildingPk) {
    const url = `${this.url}order_types_month_stats/?building=${buildingPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_types_month_stats : {}
  }

  // order counts
  async getMonthsStatsCustomer(customerPk) {
    const url = customerPk ? `${this.url}order_counts_stats/?customer=${customerPk}` : `${this.url}order_counts_stats/`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_counts_stats : {}
  }

  async getMonthsStatsBranch(branchPk) {
    const url = branchPk ? `${this.url}order_counts_stats/?branch=${branchPk}` : `${this.url}order_counts_stats/`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_counts_stats : {}
  }

  async getMonthsStatsLocation(locationPk) {
    const url = `${this.url}order_counts_stats/?location=${locationPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_counts_stats : {}
  }

  async getMonthsStatsEquipment(equipmentPk) {
    const url = `${this.url}order_counts_stats/?equipment=${equipmentPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_counts_stats : {}
  }

  async getMonthsStatsBuilding(buildingPk) {
    const url = `${this.url}order_counts_stats/?building=${buildingPk}`

    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.order_counts_stats : {}
  }

  // order types year
  async getCountsYearOrdertypeStatsCustomer(customerPk) {
    const url = customerPk ? `${this.url}counts_year_order_type_stats/?customer=${customerPk}` : `${this.url}counts_year_order_type_stats/`
    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.counts_year_order_type_stats : {}
  }

  async getCountsYearOrdertypeStatsBranch(branchPk) {
    const url = branchPk ? `${this.url}counts_year_order_type_stats/?branch=${branchPk}` : `${this.url}counts_year_order_type_stats/`
    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.counts_year_order_type_stats : {}
  }

  async getCountsYearOrdertypeStatsLocation(locationPk) {
    const url = `${this.url}counts_year_order_type_stats/?location=${locationPk}`
    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.counts_year_order_type_stats : {}
  }

  async getCountsYearOrdertypeStatsEquipment(equipmentPk) {
    const url = `${this.url}counts_year_order_type_stats/?equipment=${equipmentPk}`
    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.counts_year_order_type_stats : {}
  }

  async getCountsYearOrdertypeStatsBuilding(buildingPk) {
    const url = `${this.url}counts_year_order_type_stats/?building=${buildingPk}`
    const response = await this.axios.get(url)
    return response && 'data' in response ? response.data.counts_year_order_type_stats : {}
  }

  async getTopXCustomers() {
    const response = await this.axios.get(`${this.url}get_top_x_customers/`)
    return response.data.get_top_x_customers
  }

  async detailUuid(uuid) {
    const url = `${this.url}detail/${uuid}/`
    return this.axios.get(url).then((response) => response.data)
  }

  async getAllForCustomer(customer_pk) {
    const baseUrl = `${this.url}all_for_customer_web/?customer_id=${customer_pk}`
    const listArgs = this.getListArgs()
    const url = `${baseUrl}&${listArgs.join('&')}`

    const response = await this.axios.get(url)

    if ('count' in response.data) {
      this.count = response.data.count
    }

    if ('num_pages' in response.data) {
      this.numPages = response.data.num_pages
    }

    return response.data
  }

  getListArgs() {
    const listArgs = []

    listArgs.push(`page=${this.currentPage}`)

    if (this.searchQuery) {
      listArgs.push(`q=${this.searchQuery}`)
    }

    if (this.sort) {
      listArgs.push(`order_by=${this.sort}`)
    }

    if (this.listArgs.length) {
      for (const arg of this.listArgs) {
        listArgs.push(arg)
      }
    }

    return listArgs
  }

  async getAllForEquipmentLocation(equipment_id, location_id) {
    const filter = equipment_id ? `equipment=${equipment_id}` : `location=${location_id}`
    const baseUrl = `${this.url}all_for_equipment_location/?${filter}`
    const listArgs = this.getListArgs()
    const url = `${baseUrl}&${listArgs.join('&')}`

    const response = await this.axios.get(url)

    if ('count' in response.data) {
      this.count = response.data.count
    }

    if ('num_pages' in response.data) {
      this.numPages = response.data.num_pages
    }

    return response.data
  }
}

let orderService = new OrderService()

export default orderService
export { OrderService, OrderModel }
