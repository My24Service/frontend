import BaseService from '@/models/base'


class OrdersFilteredService extends BaseService {
  url = '/order/order/user_filter/'

  async doFilter(filter_pk) {
    this.setListArgs({user_filter: filter_pk})
    await this.list()
  }

  getCount() {
    return new this.axios.get('/order/order/user_filter_count/')
      .then(response => response.data)
  }
}

export { OrdersFilteredService }
