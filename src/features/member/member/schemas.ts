import * as v from 'valibot'
import { objectOmit } from '@vueuse/core'

import type { Member } from '@/api/types.gen'
import { vMemberMemberCreateBody } from '@/api/valibot.gen'
import { fieldsFromRecord } from '@/features/forms/record-fields'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { fieldErrors, selectMessage, type FieldErrors } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

export type MemberFormValues = v.InferInput<typeof vMemberMemberCreateBody>

export function emptyMember(): MemberFormValues {
  return {
    companycode: '',
    name: '',
    address: '',
    postal: '',
    city: '',
    country_code: 'NL',
    tel: '',
    www: 'https://',
    email: '',
    contract: null,
    contacts: '',
    member_type: 'maintenance',
    activities: '',
    info: '',
    is_deleted: false,
    is_public: true,
    has_api_users: false,
    has_branches: false,
    is_requested: true,
    has_mobile_activity_user_select: false,
  }
}

export function memberFromRecord(record: Member): MemberFormValues {
  // The record carries the logos as URLs; on the form they are the files a
  // user picks, and an untouched edit must not send the URLs back as files.
  // The upload fields show the current logos straight off the record.
  return {
    ...emptyMember(),
    ...objectOmit(fieldsFromRecord(vMemberMemberCreateBody, record), ['companylogo', 'companylogo_workorder']),
  }
}

export type MemberFieldErrors = FieldErrors<keyof MemberFormValues & string>

/** The one rule the schema cannot say: the API answered that the code is taken. */
export const COMPANYCODE_TAKEN_MESSAGE = () => $trans('Company code is already in use')

/** The logo is asked for outside the schema (only on a create), with the same required line. */
export const MEMBER_LOGO_REQUIRED_MESSAGE = () => selectMessage($trans('Company logo'))

export const LOGO_UPLOAD_EXTENSIONS = ['png', 'jpg', 'jpeg']

export const FIELD_LABELS = {
  companycode: () => $trans('Company code'),
  name: () => $trans('Name'),
  address: () => $trans('Address'),
  postal: () => $trans('Postal'),
  city: () => $trans('City'),
  chamber_of_commerce: () => $trans('Chamber of commerce'),
  vat_number: () => $trans('VAT number'),
  tel: () => $trans('Tel.'),
  email: () => $trans('Email'),
  www: () => $trans('Website (http://...)'),
  contacts: () => $trans('Contacts'),
  activities: () => $trans('Activities'),
  info: () => $trans('Info'),
} satisfies FieldLabels<keyof MemberFormValues & string>

export const COMPANYCODE_DEBOUNCE_MS = 500

export function validateMemberForm(
  values: MemberFormValues,
  { requireLogo = false }: { requireLogo?: boolean } = {},
): MemberFieldErrors {
  const errors: MemberFieldErrors = fieldErrors(vMemberMemberCreateBody, values, {}, FIELD_LABELS)

  if (requireLogo && !values.companylogo) {
    errors.companylogo = MEMBER_LOGO_REQUIRED_MESSAGE()
  }

  return errors
}

export function parseMemberForm(values: MemberFormValues): v.InferOutput<typeof vMemberMemberCreateBody> {
  return v.parse(vMemberMemberCreateBody, values)
}
