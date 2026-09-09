import * as v from 'valibot'

import type { Member } from '@/api/types.gen'
import { vEquipmentQrTypeEnum, vMemberMemberCreateBody, vMemberTypeEnum } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * Strengthenings for required fields — see ADR-0003 and member/README.md rules.
 */

export const memberFormSchema = v.object({
  ...vMemberMemberCreateBody.entries,
  companycode: v.pipe(v.string(), v.minLength(2), v.maxLength(30)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  address: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  postal: v.pipe(v.string(), v.minLength(1), v.maxLength(10)),
  city: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  tel: v.pipe(v.string(), v.minLength(1), v.maxLength(25)),
  contacts: v.pipe(v.string(), v.minLength(1)),
  activities: v.pipe(v.string(), v.minLength(1)),
  info: v.pipe(v.string(), v.minLength(1)),
})

export type MemberFormValues = {
  companycode: string
  name: string
  address: string
  postal: string
  city: string
  country_code?: string
  tel: string
  www?: string
  email: string
  contract: number | null
  contacts: string
  member_type?: (typeof vMemberTypeEnum.options)[number]
  activities: string
  info: string
  is_deleted: boolean
  is_public: boolean
  has_api_users: boolean
  has_branches: boolean
  equipment_qr_type?: (typeof vEquipmentQrTypeEnum.options)[number]
  is_requested: boolean
  has_mobile_activity_user_select: boolean
  /** Present once a replacement file was chosen; never seeded from the record. */
  companylogo?: string
  companylogo_workorder?: string
  fax?: string | null
  chamber_of_commerce?: string | null
  vat_number?: string | null
  deep_link?: string | null
}

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
  return {
    companycode: record.companycode,
    name: record.name,
    address: record.address,
    postal: record.postal,
    city: record.city,
    country_code: record.country_code,
    tel: record.tel,
    www: record.www,
    email: record.email,
    contract: record.contract ?? null,
    contacts: record.contacts,
    member_type: record.member_type,
    activities: record.activities,
    info: record.info,
    is_deleted: record.is_deleted ?? false,
    is_public: record.is_public ?? false,
    has_api_users: record.has_api_users ?? false,
    has_branches: record.has_branches ?? false,
    ...(record.equipment_qr_type ? {equipment_qr_type: record.equipment_qr_type} : {}),
    is_requested: record.is_requested ?? false,
    has_mobile_activity_user_select: record.has_mobile_activity_user_select ?? false,
    ...(record.fax !== undefined ? {fax: record.fax} : {}),
    ...(record.chamber_of_commerce !== undefined ? {chamber_of_commerce: record.chamber_of_commerce} : {}),
    ...(record.vat_number !== undefined ? {vat_number: record.vat_number} : {}),
    ...(record.deep_link !== undefined ? {deep_link: record.deep_link} : {}),
  }
}

export type MemberFieldErrors = Partial<Record<keyof MemberFormValues | 'companylogo', string>>

const MESSAGES = {
  companycode_required: () => $trans('Company code is required'),
  companycode_min_length: () => $trans('Company code must have at least 2 characters'),
  companycode_max_length: () => $trans('Company code must have at most 30 characters'),
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
  address_required: () => $trans('Please enter an address'),
  postal_required: () => $trans('Please enter a postal'),
  city_required: () => $trans('Please enter a city'),
  tel_required: () => $trans('Please enter a number'),
  email_invalid: () => $trans('Please enter a valid email'),
  www_invalid: () => $trans('Please enter a website'),
  contacts_required: () => $trans('Please enter some contacts'),
  activities_required: () => $trans('Please enter some activities'),
  info_required: () => $trans('Please enter some info'),
  companylogo_required: () => $trans('Please upload a company logo'),
  companycode_taken: () => $trans('Company code is already in use'),
} as const

export const COMPANYCODE_TAKEN_MESSAGE = MESSAGES.companycode_taken

export const MEMBER_LOGO_REQUIRED_MESSAGE = MESSAGES.companylogo_required

export const FIELD_MESSAGES = {
  name: MESSAGES.name_required,
  address: MESSAGES.address_required,
  postal: MESSAGES.postal_required,
  city: MESSAGES.city_required,
  tel: MESSAGES.tel_required,
  email: MESSAGES.email_invalid,
  www: MESSAGES.www_invalid,
  contacts: MESSAGES.contacts_required,
  activities: MESSAGES.activities_required,
  info: MESSAGES.info_required,
} as const

export const COMPANYCODE_DEBOUNCE_MS = 500

export function validateMemberForm(
  values: MemberFormValues,
  { requireLogo = false }: { requireLogo?: boolean } = {},
): MemberFieldErrors {
  const result = v.safeParse(memberFormSchema, values)

  const errors: MemberFieldErrors = {}
  if (!result.success) {
    for (const issue of result.issues) {
      const field = issue.path?.[0]?.key as keyof MemberFormValues | undefined
      if (!field || errors[field]) continue

      errors[field] = messageFor(field, issue)
    }
  }

  if (requireLogo && !values.companylogo) {
    errors.companylogo = MESSAGES.companylogo_required()
  }

  return errors
}

function messageFor(field: keyof MemberFormValues, issue: v.InferIssue<typeof memberFormSchema>): string {
  switch (field) {
    case 'companycode':
      if (issue.type === 'max_length') return MESSAGES.companycode_max_length()
      if (issue.type === 'min_length') return String(issue.input) === ''
        ? MESSAGES.companycode_required()
        : MESSAGES.companycode_min_length()
      return MESSAGES.companycode_required()
    case 'name':
      return issue.type === 'max_length' ? MESSAGES.name_max_length() : MESSAGES.name_required()
    case 'address': return MESSAGES.address_required()
    case 'postal': return MESSAGES.postal_required()
    case 'city': return MESSAGES.city_required()
    case 'tel': return MESSAGES.tel_required()
    case 'email': return MESSAGES.email_invalid()
    case 'www': return MESSAGES.www_invalid()
    case 'contacts': return MESSAGES.contacts_required()
    case 'activities': return MESSAGES.activities_required()
    case 'info': return MESSAGES.info_required()
    default: return String(issue.message)
  }
}

export function parseMemberForm(values: MemberFormValues): v.InferOutput<typeof memberFormSchema> {
  return v.parse(memberFormSchema, values)
}
