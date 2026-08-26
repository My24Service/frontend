import * as v from 'valibot'

import type { Member } from '@/api/types.gen'
import { vEquipmentQrTypeEnum, vMemberMemberCreateBody, vMemberTypeEnum } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * The Member form's validation, derived from the generated request schema.
 *
 * `vMemberMemberCreateBody` is what `POST`/`PATCH /api/member/member/`
 * declare as their body, so it — not a hand-written rule set — decides what
 * this form may send. Both endpoints share one writable shape, so one schema
 * covers the form in both modes; the update path simply never sends the
 * readonly fields the detail response added (`id`, `contract_text`,
 * `companylogo_url`, `companylogo_workorder_url`) nor the stored logos, which
 * only ever ride out when a replacement file was chosen.
 *
 * Strengthenings on top of the schema, both inherited from what the API
 * actually enforces and the legacy screen characterised:
 *
 *   - DRF's `required=True` means "present and not blank" on the backend
 *     (`allow_blank` defaults to False), but reaches the generated schema only
 *     as a plain `string` — an empty string would parse and then be rejected
 *     with "This field may not be blank". `minLength(1)` until the generator
 *     emits required-ness (the request-schema correctness ticket).
 *   - A company code is at least two characters, the floor the legacy screen
 *     enforced and the availability probe below honours too.
 *
 * One requirement sits outside the schema entirely: a company logo is
 * required on create. The legacy screen demanded it and the create capture
 * uploaded one; nothing here can verify what the backend would do without it,
 * so the rule is kept rather than relaxed.
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

/** What the form edits before it is valid: an empty member-shaped slate. */
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
  /** Optional text fields; created empty-handed, filled from the record on edit. */
  fax?: string | null
  chamber_of_commerce?: string | null
  vat_number?: string | null
  deep_link?: string | null
}

/**
 * A new member as the legacy screen opened one: `www` prefilled to just the
 * scheme, the Netherlands picked, maintenance chosen, and the boolean flags
 * the old model's field defaults carried — which is what puts the recorded
 * create body's `is_requested: true` and friends on the wire.
 */
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

/**
 * The writable slice of a loaded record. Deliberately excludes the stored
 * logos: they are display-only, and sending one back would overwrite it with
 * its own URL. `id` and the other readonly response fields are excluded too —
 * the parse below would drop them anyway.
 */
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

/** Field-level copy, keyed by field. A missing key means the field passed. */
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

/**
 * The copy a field shows while it simply sits empty, before any submit —
 * the same words {@link validateMemberForm} reports once that field fails.
 * Templates use these instead of restating the strings, so a wording change
 * happens in this file and nowhere else.
 */
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

/**
 * How long typing must pause before the availability probe fires. Long enough
 * that a fast typist never sees a request per keystroke; short enough that
 * the verdict arrives before they reach for Submit.
 */
export const COMPANYCODE_DEBOUNCE_MS = 500

/**
 * Validate form values against the request schema, returning one message per
 * broken field.
 *
 * Which fields broke comes from the schema's issues; the message is this
 * screen's copy for that failure kind. `requireLogo` is the create-only
 * strengthening described at the top of this file.
 */
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
      // An empty code is a missing one; anything short is too short.
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

/**
 * The request body for a save: the form values through the request schema, so
 * what goes on the wire is exactly what the API declares — typed, stripped of
 * keys it does not know (the readonly response fields die right here), and
 * only ever called after {@link validateMemberForm} passed.
 */
export function parseMemberForm(values: MemberFormValues): v.InferOutput<typeof memberFormSchema> {
  return v.parse(memberFormSchema, values)
}
