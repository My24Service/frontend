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

/**
 * Money for a render path that must not take a screen down over one bad
 * backend value: an absent, blank or unparseable amount (or an unsupported
 * currency) yields null instead of throwing. `toDinero` is the strict form;
 * this is the tolerant one callers ask for by name.
 */
function tryToDinero(value: unknown, currency: string): ReturnType<typeof toDinero> | null {
  if (value === null || value === undefined || value === '') return null
  try {
    return toDinero(String(value), currency)
  } catch {
    return null
  }
}

export {
  toDinero,
  tryToDinero,
}
