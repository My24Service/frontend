import * as v from 'valibot'
import BaseModel from '../base'
import { vSupplier, vSupplierCreateUpdate } from '@/api/valibot.gen'
import { formDefaults, formSchema, lenient, writeSchema } from '../schema'

/**
 * Generated from `SupplierSerializer` via the OpenAPI schema - the field
 * list, types and constraints come from `src/api/valibot.gen.ts`. Regenerate
 * with `npm run codegen`.
 *
 * The serializer also carries a `UniqueTogetherValidator` over
 * (identifier, name, address, city, postal, country_code) - a cross-field
 * constraint that only the backend can enforce, so it is documented rather
 * than reimplemented here.
 */
export const SupplierSchema = lenient(vSupplier)

/**
 * The form's blank values. Every field here is a nullable column bound to a
 * text input, so it starts `''` rather than the `null` its type implies -
 * except `country_code`, which the tenant's forms start at 'NL'. These are UI
 * decisions and no longer touch what the schema accepts.
 */
const FORM_DEFAULTS = {
  name: '',
  address: '',
  postal: '',
  city: '',
  country_code: 'NL',
  tel: '',
  email: '',
  contact: '',
  mobile: '',
  remarks: '',
  identifier: '',
}

/**
 * `SupplierCreateUpdateSerializer` is a real serializer in the backend, so
 * the write shape is generated too rather than derived by omitting keys from
 * the read shape. Only the read-only pk is dropped.
 *
 * `country_code` is a plain string here, not an enum. It is a `ChoiceField`
 * whose choices are loaded per tenant from the `countries` setting, and the
 * schema is generated against a single tenant - enumerating them would reject
 * values that are perfectly valid for another tenant. The backend types it as
 * a bare string for that reason; see `TenantChoiceField` in
 * apps/core/schema_utils.py.
 */
export const SupplierWriteSchema = writeSchema(vSupplierCreateUpdate, ['id'])

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
  fields = formDefaults(SupplierFormSchema, FORM_DEFAULTS)

  url = '/inventory/supplier/'

  search(query: string) {
    return this.axios.get(`${this.url}autocomplete/?q=${query}`).then((response) => response.data)
  }
}

const supplierModel = new SupplierService()

export default supplierModel
export { SupplierService }
