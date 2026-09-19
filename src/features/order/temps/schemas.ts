import * as v from 'valibot'

import type { OrderDetail } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import {
  emptyOrder,
  orderFromRecord,
  parseOrderBody,
  validateOrderForm,
  type FormVariant,
  type OrderBody,
  type OrderChildren,
  type OrderFieldErrors,
  type OrderFormValues,
} from '../form/schemas'

/**
 * The temps order: the planning order plus `required_users`, how many
 * people the order needs. That field is on the model and on every read
 * serializer, but no create or update serializer lists it yet — the body
 * carries it so the day the backend declares it nothing here changes, and
 * until then the backend ignores it as it always has.
 */
export interface TempsFormValues extends OrderFormValues {
  /** Bound to a text input; parsed to a positive integer on save. */
  required_users: string
}

export type TempsBody = OrderBody & {required_users?: number}

export type TempsFieldErrors = OrderFieldErrors & {required_users?: string}

export function emptyTempsOrder(): TempsFormValues {
  return {...emptyOrder(), required_users: '1'}
}

export function tempsFromRecord(record: OrderDetail): TempsFormValues {
  return {...orderFromRecord(record), required_users: String(record.required_users ?? 1)}
}

const requiredUsers = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d+$/),
  v.transform(Number),
  v.minValue(1),
)

export function validateTempsForm(
  values: TempsFormValues,
  variant: FormVariant,
  context: {isCreate: boolean},
): TempsFieldErrors {
  const {required_users, ...order} = values
  const errors: TempsFieldErrors = validateOrderForm(order, variant, context)
  if (required_users.trim() !== '' && !v.safeParse(requiredUsers, required_users).success) {
    errors.required_users = $trans('Please enter a whole number of people, at least 1')
  }
  return errors
}

export function parseTempsBody(
  values: TempsFormValues,
  variant: FormVariant,
  context: {isCreate: boolean},
  children: OrderChildren = {},
): TempsBody {
  const {required_users, ...order} = values
  const body: TempsBody = parseOrderBody(order, variant, context, children)
  if (required_users.trim() !== '') body.required_users = v.parse(requiredUsers, required_users)
  return body
}
