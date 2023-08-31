import {toDinero} from "../utils";

let priceMixin = {
  setPriceFields(obj) {
    for (let i=0; i<this.priceFields.length; i++) {
      const field = this.priceFields[i]
      const dinero_field = `${field}_dinero`
      const currency_field = `${field}_currency`

      if (obj[field] && obj[currency_field]) {
        this[dinero_field] = toDinero(
          obj[field], obj[currency_field])
      } else {
        console.debug(`not all fields here for field ${field}`)
      }
    }
  },

  setPriceField(field, priceDinero) {
    const dinero_field = `${field}_dinero`
    const currency_field = `${field}_currency`
    this[dinero_field] = priceDinero
    this[field] = this[dinero_field].toFormat('0.00')
    this[currency_field] = this[dinero_field].getCurrency()

    return true
  }
}

export default priceMixin
