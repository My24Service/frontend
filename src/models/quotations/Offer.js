import BaseModel from '../../models/base'


class OfferModel {
  id
  quotation
  recipients
  subject
  body

  constructor(offer) {
    for (const [k, v] of Object.entries(offer)) {
      this[k] = v
    }
  }
}


class OfferService extends BaseModel {
  url = '/quotation/offer/'
  listArgs = []

  async getDocuments(quotationId) {
    const url = `${this.url}get_documents/?quotationId=${quotationId}`
    return this.axios.get(url).then((response) => response.data)
  }

  async getUnsentOffer(quotationId) {
    const url = `${this.url}get_unsent_offer/?quotationId=${quotationId}`
    return this.axios.get(url).then((response) => response.data)
  }
}

export { OfferService, OfferModel }
