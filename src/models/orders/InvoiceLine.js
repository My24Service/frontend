import BaseModel from '@/models/base'


class InvoiceLineModel {
  id
  type
  invoice
  description
  amount
  vat
  price
  price_currency

  constructor(invoiceLine) {
    for (const [k, v] of Object.entries(invoiceLine)) {
      this[k] = v
    }
  }
}


class InvoiceLine extends BaseModel {
  fields = {
    id: null,
    invoice: null,
    description: null,
    amount: null,
    vat: null,
    price: null,
    price_currency: null,
  }

  url = '/order/invoice/'

  async getData(uuid) {
    const url = `${this.url}data/${uuid}/`
    return this.axios.get(url).then((response) => response.data)
  }
}

export default new InvoiceLine()

export { InvoiceLineModel }
