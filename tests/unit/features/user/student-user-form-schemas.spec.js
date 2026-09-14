import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vStudentUserWriteRequestWritable } from '@/api/valibot.gen'

import {
  emptyStudentUser,
  parseStudentUserForm,
  validateStudentUserForm,
} from '@/features/user/student/schemas'

// The form holds the write body's own shape, plus the two client-only
// password fields.
const valid = {
  username: 'student-jan',
  first_name: 'Jan',
  last_name: 'Student',
  email: 'student-jan@example.test',
  password1: 'secret-password',
  password2: 'secret-password',
  student_user: {
    street: 'Main street',
    house_number: '1',
    house_number_addition: 'a',
    postal: '1234 AB',
    city: 'Amsterdam',
    country_code: 'NL',
    mobile: '+31612345678',
    iban: 'NL44RABO0123456789',
    gender: 'M',
    dob: '2000-01-15',
    drivers_licence: 'Y',
    drivers_licence_type: 'B',
    box_truck: 'N',
    bsn: '123456789',
    info: 'Third-year apprentice',
  },
}

/** `valid` with some of its profile fields replaced. */
function withProfile(profile, values = valid) {
  return { ...values, student_user: { ...values.student_user, ...profile } }
}

function wirePayload(values = valid) {
  const { password1, password2, ...body } = values
  return structuredClone(body)
}

describe('vStudentUserWriteRequestWritable', () => {
  test('accepts a payload the API would store', () => {
    expect(v.safeParse(vStudentUserWriteRequestWritable, wirePayload()).success).toBe(true)
  })

  test('is the generated request schema, with the identity fields made required', () => {
    expect(v.safeParse(vStudentUserWriteRequestWritable, {
      ...wirePayload(),
      username: '',
    }).success).toBe(false)

    expect(v.safeParse(vStudentUserWriteRequestWritable, {
      ...wirePayload(),
      email: 'not-an-email',
    }).success).toBe(false)
  })

  test('an empty date of birth rides as null, an empty IBAN as absent', () => {
    // The form holds '' until typed; `dob` is nullish and `iban` optional, so
    // the payload shapes them rather than failing the parse.
    const payload = wirePayload(withProfile({dob: '', iban: ''}))
    delete payload.student_user.iban
    payload.student_user.dob = null
    expect(v.safeParse(vStudentUserWriteRequestWritable, payload).success).toBe(true)

    expect(v.safeParse(vStudentUserWriteRequestWritable, wirePayload(withProfile({dob: ''}))).success)
      .toBe(false)
  })

  test('strips fields the request schema does not declare', () => {
    const result = v.parse(vStudentUserWriteRequestWritable, {
      ...wirePayload(),
      password1: 'secret-password',
      password2: 'secret-password',
      id: 41,
      full_name: 'Jan Student',
      student_user: {
        ...wirePayload().student_user,
        uuid: '9f8b1a2c-3d4e-5f60-7890-abcdef123456',
        rating_avg: 4.5,
        picture_url: 'https://example.test/pic.jpg',
      },
    })
    expect(Object.keys(result).sort()).toEqual(
      ['email', 'first_name', 'last_name', 'student_user', 'username'],
    )
    expect(result.student_user).not.toHaveProperty('uuid')
    expect(result.student_user).not.toHaveProperty('rating_avg')
    expect(result.student_user).not.toHaveProperty('picture_url')
  })
})

describe('emptyStudentUser', () => {
  test('gives a fresh form its defaults', () => {
    expect(emptyStudentUser()).toEqual({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password1: '',
      password2: '',
      student_user: {
        street: '',
        house_number: '',
        house_number_addition: '',
        postal: '',
        city: '',
        country_code: 'NL',
        mobile: '',
        iban: '',
        gender: 'M',
        dob: '',
        drivers_licence: 'N',
        drivers_licence_type: '',
        box_truck: 'N',
        bsn: '',
        info: '',
      },
    })
  })

  test('the defaults are not yet submittable on create', () => {
    const errors = validateStudentUserForm(emptyStudentUser(), {isCreate: true})
    expect(errors.username).toBe('Username is required')
    expect(errors.first_name).toBe('Please enter a first name')
    expect(errors.email).toBe('Please enter a valid email')
    expect(errors.password1).toBe('Please enter a password')
  })
})

describe('validateStudentUserForm', () => {
  test('passes a good payload with no messages', () => {
    expect(validateStudentUserForm(valid, {isCreate: true})).toEqual({})
  })

  test('an untouched date of birth and IBAN pass', () => {
    expect(validateStudentUserForm(withProfile({dob: '', iban: ''}), {isCreate: true})).toEqual({})
  })

  test('blames each blank field by name', () => {
    expect(validateStudentUserForm({...valid, username: ''}, {isCreate: true}).username)
      .toBe('Username is required')
    expect(validateStudentUserForm({...valid, email: 'nope'}, {isCreate: true}).email)
      .toBe('Please enter a valid email')
    expect(validateStudentUserForm({...valid, first_name: ''}, {isCreate: true}).first_name)
      .toBe('Please enter a first name')
    expect(validateStudentUserForm({...valid, last_name: ''}, {isCreate: true}).last_name)
      .toBe('Please enter a last name')
  })

  test('a mistyped date of birth is refused at the dob input', () => {
    // The message is addressed to `student_user.dob`, so the error is keyed by
    // the leaf the form renders it at — not by the sub-object's own key.
    expect(validateStudentUserForm(withProfile({dob: 'yesterday'}), {isCreate: true}))
      .toEqual({dob: 'Please use yyyy-mm-dd for the date of birth'})
  })

  test('a sub-object failure the form has no copy for keeps the sub-object key', () => {
    // `country_code` is the one other sub-object entry an input can empty
    // (`iban` rides absent when blank and `dob` null). It has no message of
    // its own, so the issue falls back to the first path segment.
    const errors = validateStudentUserForm(withProfile({country_code: ''}), {isCreate: true})

    expect(Object.keys(errors)).toEqual(['student_user'])
    expect(errors.student_user).toEqual(expect.any(String))
  })

  test('on create both passwords are required and must match', () => {
    expect(validateStudentUserForm({...valid, password1: '', password2: ''}, {isCreate: true}))
      .toEqual({
        password1: 'Please enter a password',
        password2: 'Passwords do not match',
      })
    expect(validateStudentUserForm({...valid, password2: 'other'}, {isCreate: true}))
      .toEqual({password2: 'Passwords do not match'})
  })

  test('on edit empty passwords pass, a filled one still needs its confirm', () => {
    expect(validateStudentUserForm({...valid, password1: '', password2: ''}, {isCreate: false}))
      .toEqual({})
    expect(validateStudentUserForm({...valid, password1: 'new-secret', password2: ''}, {isCreate: false}))
      .toEqual({password2: 'Passwords do not match'})
    expect(validateStudentUserForm(
      {...valid, password1: 'new-secret', password2: 'new-secret'},
      {isCreate: false},
    )).toEqual({})
  })
})

describe('parseStudentUserForm', () => {
  test('the create body carries exactly the write schema’s fields', () => {
    const body = parseStudentUserForm(withProfile({dob: '', iban: ''}), {isCreate: true})
    expect(Object.keys(body).sort()).toEqual(
      ['email', 'first_name', 'last_name', 'password', 'student_user', 'username'],
    )
    expect(body.password).toBe('secret-password')
    expect(body.student_user.dob).toBeNull()
    expect(body.student_user).not.toHaveProperty('iban')
  })

  test('a filled date of birth and IBAN ride the wire', () => {
    const body = parseStudentUserForm(valid, {isCreate: true})
    expect(body.student_user.dob).toBe('2000-01-15')
    expect(body.student_user.iban).toBe('NL44RABO0123456789')
  })

  test('an untouched password rides an edit as absent, not as an empty string', () => {
    const body = parseStudentUserForm(
      {...valid, password1: '', password2: ''},
      {isCreate: false},
    )
    expect(body).not.toHaveProperty('password')
  })
})

/**
 * The API's username charset (`/^[\w.@+-]+$/`) is declared by the generated
 * request schema. It went unenforced for as long as the sibling forms
 * redeclared the `username` entry instead of using it.
 */
describe('username charset', () => {
  test('it refuses a username the API would refuse', () => {
    const values = {
      ...emptyStudentUser(),
      username: 'jan student',
      first_name: 'Jan',
      last_name: 'Student',
      email: 'jan@example.test',
      password1: 'secret-password',
      password2: 'secret-password',
    }
    expect(validateStudentUserForm(values, { isCreate: true }).username)
      .toBe('Please use only letters, digits and @ . + - _')
  })
})
