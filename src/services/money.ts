/**
 * Money: `toDinero` plus the shared formatters.
 *
 * A decimal price (number or string) becomes a dinero.js object for the three
 * currencies the app supports, so callers can format and add amounts without
 * float drift. It used to sit in `src/services/i18n.ts` beside `$trans` and the
 * toasts, under a filename that described only the translation helper.
 *
 * All `toFormat` literals live here so rendered output stays byte-identical
 * from one call site: `formatMoney` is `$0.00`, `formatMoneyPlain` is `0.00`,
 * and `formatMoneyEuropean` is the tenant's European spelling (`$1.234,56`).
 */

import Dinero from "dinero.js";

export type Money = ReturnType<typeof toDinero>;

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
  formatMoney,
  formatMoneyPlain,
  formatMoneyEuropean,
};

/** Display amount with currency symbol, e.g. `$1,234.56` (dinero `$0.00`). */
function formatMoney(money: Money): string {
  return money.toFormat('$0.00')
}

/** Plain two-decimal amount for wire bodies, e.g. `1234.56` (dinero `0.00`). */
function formatMoneyPlain(money: Money): string {
  return money.toFormat('0.00')
}

/** `$1,234.56` in the tenant's European spelling: `$1.234,56`. */
function formatMoneyEuropean(money: Money): string {
  const parts = money.toFormat('$0,0.00').split('.')
  return `${parts[0].replace(/,/g, '.')},${parts[1]}`
}
