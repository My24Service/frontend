import BaseModel from '../../models/base'


class EmailModel {
  id
  invoice
  recipients
  subject
  body

  constructor(offer) {
    for (const [k, v] of Object.entries(offer)) {
      this[k] = v
    }
  }
}


class EmailService extends BaseModel {
  url = '/invoice/email/'
  listArgs = []

  async getDocuments(invoiceId) {
    const url = `${this.url}get_documents/?invoiceId=${invoiceId}`
    return this.axios.get(url).then((response) => response.data)
  }

  async getUnsentEmail(invoiceId) {
    const url = `${this.url}get_unsent_email/?invoiceId=${invoiceId}`
    return this.axios.get(url).then((response) => response.data)
  }
}

export { EmailService, EmailModel }
