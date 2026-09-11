/**
 * Money: `toDinero`, and nothing else.
 *
 * A decimal price (number or string) becomes a dinero.js object for the three
 * currencies the app supports, so callers can format and add amounts without
 * float drift. It used to sit in `src/services/i18n.ts` beside `$trans` and the
 * toasts, under a filename that described only the translation helper.
 */

import Dinero from "dinero.js";

function toDinero(priceDecimal: number | string | null | undefined, currency: string) {
  if (currency === 'EUR' || currency === 'USD' || currency === 'GBP') {
    let amount = priceDecimal ? Number(priceDecimal) * 100 : 0
    amount = parseInt(amount.toFixed(0))
    if (isNaN(amount)) {
      console.error('toDinero - invalid input for amount', priceDecimal)
      throw `toDinero - invalid input for amount: ${priceDecimal}`
    }
    return Dinero({ amount, currency })
  } else {
    throw `${currency} not supported`
  }
}

export {
  toDinero,
}
