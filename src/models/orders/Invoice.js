import BaseModel from '@/models/base'


class Invoice extends BaseModel {
  fields = {
    id: null,
    order: null,
    vat: null,
    total: null,
    total_currency: null,
  }

  url = '/order/invoice/'

  async getData(uuid) {
    const url = `${this.url}data/${uuid}/`
    return this.axios.get(url).then((response) => response.data)
  }
}

const invoiceModel = new Invoice()

export default invoiceModel
