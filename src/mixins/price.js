import {toDinero} from "../utils";

let priceMixin = {
  setPriceFields(obj) {
    for (let i=0; i<this.priceFields.length; i++) {
      const field = this.priceFields[i]
      const currency_field = `${field}_currency`

      if (obj[field] && obj[currency_field]) {
        // console.log(`creating dinero object for field: ${field}, amount: ${obj[field]}, currency: ${obj[currency_field]}`)
        const dinero = toDinero(obj[field], obj[currency_field])
        this.setPriceField(field, dinero)
      } else {
        console.debug(`not all fields here for field ${field}`)
      }
    }
  },

  setPriceField(field, priceDinero) {
    // console.log(`setPriceField(${field}, ${priceDinero.toFormat('0.00')})`)
    const dinero_field = `${field}_dinero`
    const currency_field = `${field}_currency`
    this[dinero_field] = priceDinero
    this[field] = this[dinero_field].toFormat('0.00')
    this[currency_field] = this[dinero_field].getCurrency()

    return true
  }
}

export default priceMixin
