import * as v from 'valibot'
import BaseModel from '../base'
import { fk, formFields, formSchema, nullableStr, str, timestamp, writeSchema } from '../schema'

/**
 * Mirrors `SupplierSerializer` (apps/inventory/serializers.py).
 *
 * Every CharField on the model is `null=True, blank=True` except
 * `country_code`, which is non-null with a `'NL'` default. The serializer also
 * carries a `UniqueTogetherValidator` over
 * (identifier, name, address, city, postal, country_code) - a cross-field
 * constraint that only the backend can enforce, so it is documented rather
 * than reimplemented here.
 */
export const SupplierSchema = v.object({
  id: fk(),
  name: nullableStr(''),
  address: nullableStr(''),
  postal: nullableStr(''),
  city: nullableStr(''),
  country_code: str('NL'),
  tel: nullableStr(''),
  external_identifier: nullableStr(),
  email: nullableStr(''),
  contact: nullableStr(''),
  mobile: nullableStr(''),
  remarks: nullableStr(''),
  identifier: nullableStr(''),
  created: timestamp(),
  modified: timestamp(),
})

/**
 * Mirrors `SupplierCreateUpdateSerializer`, which drops the timestamps and
 * narrows `country_code` to a `ChoiceField` whose choices come from the
 * tenant's `countries` setting. Those choices are per-tenant and resolved at
 * request time, so they cannot be enumerated statically - `country_code` stays
 * a plain string here and the backend remains the authority.
 */
export const SupplierWriteSchema = writeSchema(SupplierSchema, ['id', 'created', 'modified'])

export const SupplierFormSchema = formSchema(SupplierSchema, [
  'name',
  'address',
  'postal',
  'city',
  'country_code',
  'tel',
  'email',
  'contact',
  'mobile',
  'remarks',
  'identifier',
])

export type Supplier = v.InferOutput<typeof SupplierSchema>
export type SupplierWrite = v.InferOutput<typeof SupplierWriteSchema>

class SupplierService extends BaseModel {
  fields = formFields(SupplierFormSchema)

  url = '/inventory/supplier/'

  search(query: string) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }
}

const supplierModel = new SupplierService()

export default supplierModel
export { SupplierService }
