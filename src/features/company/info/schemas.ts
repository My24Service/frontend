import * as v from 'valibot'

import { vPatchedMemberRequest } from '@/api/valibot.gen'
import type { Member } from '@/api/types.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * The company info form's own state: the dozen text fields the screen owns,
 * plus the two staged logos. The record's own logos (URLs the write endpoint
 * rejects) never enter the values - only the current-image displays read
 * them off the record. The company code shows readonly and rides no body.
 */
export interface InfoFormValues {
  name: string
  chamber_of_commerce: string | null
  vat_number: string | null
  address: string
  postal: string
  city: string
  country_code: string
  tel: string
  www: string
  email: string
  contacts: string
  info: string
  activities: string
  /** A newly picked logo as a data URL, or null when no file was chosen. */
  companylogo: string | null
  /** A newly picked workorder logo as a data URL, or null when none was chosen. */
  companylogo_workorder: string | null
}

export type InfoFormErrors = FieldErrors<keyof InfoFormValues & string>

/** The blank form state the kit starts from, before the record arrives. */
export function emptyInfo(): InfoFormValues {
  return {
    name: '',
    chamber_of_commerce: null,
    vat_number: null,
    address: '',
    postal: '',
    city: '',
    country_code: '',
    tel: '',
    www: '',
    email: '',
    contacts: '',
    info: '',
    activities: '',
    companylogo: null,
    companylogo_workorder: null,
  }
}

/** The fetched record as form values: the fields this screen owns. */
export function infoFromRecord(record: Member): InfoFormValues {
  return {
    name: record.name,
    chamber_of_commerce: record.chamber_of_commerce ?? null,
    vat_number: record.vat_number ?? null,
    address: record.address,
    postal: record.postal,
    city: record.city,
    country_code: record.country_code ?? '',
    tel: record.tel,
    www: record.www,
    email: record.email,
    contacts: record.contacts,
    info: record.info,
    activities: record.activities,
    companylogo: null,
    companylogo_workorder: null,
  }
}

const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  address_required: () => $trans('Please enter an address'),
  postal_required: () => $trans('Please enter an postal code'),
  city_required: () => $trans('Please enter a city'),
  tel_required: () => $trans('Please enter a number'),
  email_required: () => $trans('Please enter a valid email'),
  www_required: () => $trans('Please enter a website'),
  contacts_required: () => $trans('Please enter some contacts'),
  info_required: () => $trans('Please enter some info'),
  activities_required: () => $trans('Please enter some activities'),
} as const

// Each field says one thing whatever went wrong: the legacy screen showed a
// single message per field, and its two failure modes - blank, and not a
// url/email - read the same sentence. The zero-argument thunk satisfies
// `FieldMessage`, which passes an issue the copy does not use.
function oneMessage(message: () => string) {
  return () => message()
}

export const FIELD_MESSAGES = {
  name: oneMessage(MESSAGES.name_required),
  address: oneMessage(MESSAGES.address_required),
  postal: oneMessage(MESSAGES.postal_required),
  city: oneMessage(MESSAGES.city_required),
  tel: oneMessage(MESSAGES.tel_required),
  email: oneMessage(MESSAGES.email_required),
  www: oneMessage(MESSAGES.www_required),
  contacts: oneMessage(MESSAGES.contacts_required),
  info: oneMessage(MESSAGES.info_required),
  activities: oneMessage(MESSAGES.activities_required),
} satisfies FieldMessages<keyof InfoFormValues & string>

/**
 * The wire-shaped body: the staged logos ride only when files were picked -
 * an absent PATCH key leaves the stored files unchanged, which is what the
 * legacy screen's deletes did.
 */
function shaped(values: InfoFormValues) {
  return {
    name: values.name,
    chamber_of_commerce: values.chamber_of_commerce,
    vat_number: values.vat_number,
    address: values.address,
    postal: values.postal,
    city: values.city,
    country_code: values.country_code,
    tel: values.tel,
    www: values.www,
    email: values.email,
    contacts: values.contacts,
    info: values.info,
    activities: values.activities,
    ...(values.companylogo ? { companylogo: values.companylogo } : {}),
    ...(values.companylogo_workorder ? { companylogo_workorder: values.companylogo_workorder } : {}),
  }
}

/**
 * The patch body leaves every field optional, and every one of the ten the
 * legacy screen required is non-blank once present. The shaped body always
 * carries all ten, so a blank one is refused without a rule of this file's
 * own.
 */
export function validateInfo(values: InfoFormValues): InfoFormErrors {
  return fieldErrors(vPatchedMemberRequest, shaped(values), FIELD_MESSAGES)
}

/**
 * The body to send, as the generated patch component resolves it: the form's
 * fields, stripped of anything the endpoint does not declare - the record's
 * readonly companions the legacy screen sent along ride no more, and DRF
 * ignored them either way.
 */
export function parseInfo(values: InfoFormValues) {
  return v.parse(vPatchedMemberRequest, shaped(values))
}
