import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import {
  emptyMember,
  memberFormSchema,
  parseMemberForm,
  validateMemberForm,
} from '@/features/member/member/schemas'

/**
 * The Member form schema, directly.
 *
 * The form validates against the **generated** request schema
 * (`vMemberMemberCreateBody`), so what a form may send is exactly what the API
 * declares — not a parallel hand-written description that can drift. These
 * specs pin that: the schema is the generated one with its named
 * strengthenings, a payload the API would reject fails validation with a
 * field-level message, and the parsed output is the body — stripped of every
 * key the request schema does not declare.
 *
 * That last property is where this screen earns its keep: the detail response
 * carries `id`, `contract_text`, `companylogo_url` and
 * `companylogo_workorder_url`, and the old form handed the whole record back.
 * The parse is what kills them (the declared exception on #325).
 */

/** `emptyMember()` plus every required field filled with acceptable values. */
const valid = {
  ...emptyMember(),
  companycode: 'acme',
  name: 'Acme BV',
  address: 'Weg 1',
  postal: '1234AZ',
  city: 'Amsterdam',
  tel: '0612345678',
  email: 'info@example.com',
  www: 'https://example.com',
  contacts: 'Me',
  activities: 'Developing',
  info: 'A member',
}

describe('memberFormSchema', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(memberFormSchema, valid).success).toBe(true)
  })

  test('is the generated request schema, strengthened for blank strings', () => {
    // The generated writable schema accepts '' wherever it has only a
    // maxLength; the form schema must not, on any field DRF requires.
    for (const field of ['name', 'address', 'postal', 'city', 'tel', 'contacts', 'activities', 'info']) {
      expect(v.safeParse(memberFormSchema, {...valid, [field]: ''}).success).toBe(false)
    }

    // Everything else about the shape stays the generated one: at the limits
    // the schema declares, both sides agree.
    expect(v.safeParse(memberFormSchema, {...valid, companycode: 'a'.repeat(30)}).success).toBe(true)
    expect(v.safeParse(memberFormSchema, {...valid, companycode: 'a'.repeat(31)}).success).toBe(false)
    expect(v.safeParse(memberFormSchema, {...valid, name: 'a'.repeat(255)}).success).toBe(true)
    expect(v.safeParse(memberFormSchema, {...valid, name: 'a'.repeat(256)}).success).toBe(false)
  })

  test('keeps the generated floor of two characters on a company code', () => {
    expect(v.safeParse(memberFormSchema, {...valid, companycode: ''}).success).toBe(false)
    expect(v.safeParse(memberFormSchema, {...valid, companycode: 'a'}).success).toBe(false)
    expect(v.safeParse(memberFormSchema, {...valid, companycode: 'ab'}).success).toBe(true)
  })

  test('holds email and www to the formats the schema declares', () => {
    expect(v.safeParse(memberFormSchema, {...valid, email: 'not-an-email'}).success).toBe(false)
    expect(v.safeParse(memberFormSchema, {...valid, www: 'example.com'}).success).toBe(false)
  })
})

describe('validateMemberForm', () => {
  test('returns nothing for a valid form', () => {
    expect(validateMemberForm(valid)).toEqual({})
  })

  test('reports one message per broken field', () => {
    const errors = validateMemberForm({...valid, name: '', city: '', email: 'nope'})

    expect(Object.keys(errors).sort()).toEqual(['city', 'email', 'name'])
    expect(errors.name).toContain('name')
    expect(errors.city).toContain('city')
    expect(errors.email).toContain('email')
  })

  test('an empty company code reads as missing, a short one as too short', () => {
    const empty = validateMemberForm({...valid, companycode: ''})
    const short = validateMemberForm({...valid, companycode: 'a'})

    expect(empty.companycode).toContain('required')
    expect(short.companycode).toContain('at least 2')
  })

  test('the create-only logo requirement sits outside the schema', () => {
    const {companylogo, ...withoutLogo} = valid

    expect(validateMemberForm(withoutLogo)).toEqual({})
    expect(validateMemberForm(withoutLogo, {requireLogo: true}).companylogo)
      .toContain('Please upload a company logo')
    // And a chosen file satisfies it - the data URL is the requirement's shape.
    expect(validateMemberForm({...withoutLogo, companylogo: 'data:image/png;base64,AAA'},
      {requireLogo: true})).toEqual({})
  })
})

describe('parseMemberForm', () => {
  test('output is exactly the body: declared fields only, in the schema’s shape', () => {
    const body = parseMemberForm({
      ...valid,
      // Everything below rides in on a loaded record; none of it is declared
      // by the request schema, so none of it may leave the form.
      id: 19,
      contract_text: 'SHLTR-Branch (...)',
      companylogo_url: '/media/logos/shltr/x.png',
      companylogo_workorder_url: null,
      created: '30/05/2023 16:25',
      modified: '15/09/2025 16:59',
      companylogo: 'data:image/png;base64,AAA',
    })

    expect(Object.keys(body).sort()).toEqual([
      'activities', 'address', 'city', 'companycode',
      'companylogo', 'contacts', 'contract', 'country_code', 'email',
      'has_api_users', 'has_branches', 'has_mobile_activity_user_select',
      'info', 'is_deleted', 'is_public', 'is_requested', 'member_type',
      'name', 'postal', 'tel', 'www',
    ].sort())
    expect(body.id).toBeUndefined()
    expect(body.contract_text).toBeUndefined()
    expect(body.companylogo_url).toBeUndefined()
    expect(body.companylogo_workorder_url).toBeUndefined()
  })

  test('keys never chosen stay absent instead of null', () => {
    const body = parseMemberForm(valid)

    // No equipment QR type was picked and no logo was uploaded, so neither
    // key appears - what JSON.stringify would put on the wire for both.
    expect('equipment_qr_type' in body).toBe(false)
    expect('companylogo' in body).toBe(false)
    expect('fax' in body).toBe(false)
  })
})
