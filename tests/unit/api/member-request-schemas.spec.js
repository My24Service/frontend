import {describe, expect, test} from 'vitest'
import * as v from 'valibot'

import {
  vContractCreateRequest,
  vPatchedContractRequest,
  vContractWritable,
  vMemberRequest,
  vPatchedMemberRequest,
} from '@/api/valibot.gen'

// These pin the two request-side corrections from #317 that would regress
// silently. Both are the failure the ticket names: a schema that is wrong in
// the validator's role tells the user something false about their own form,
// and the form is the only place anyone would notice.
//
// The schemas here are generated, so a regression arrives as a schema.yaml
// regeneration rather than as an edit to a file anyone reads.

describe('Member request schemas', () => {
  // The whole payload the form builds, so `v.parse` reaches the logo field
  // instead of failing on a missing sibling first.
  const member = () => ({
    companycode: 'demo',
    name: 'Demo BV',
    address: 'Street 1',
    tel: '0612345678',
    www: 'https://example.com',
    postal: '1234AB',
    city: 'Amsterdam',
    email: 'demo@example.com',
    contacts: 'Someone',
    activities: 'Maintenance',
    info: 'Info',
  })

  describe('companylogo accepts what the API stores', () => {
    // MemberForm reads the file with FileReader.readAsDataURL, so this exact
    // shape is what a logo upload puts on the wire.
    test('a data URI, as MemberForm sends it', () => {
      const body = {...member(), companylogo: 'data:image/png;base64,iVBORw0KGgo='}

      expect(() => v.parse(vMemberRequest, body)).not.toThrow()
    })

    // drf_extra_fields' Base64ImageField takes the payload with or without the
    // data URI preamble. While the field was declared `format: uri` the
    // generated client refused the bare form outright — a body the API would
    // have stored, rejected before it was sent.
    test('a bare base64 payload, which Base64ImageField also decodes', () => {
      const body = {...member(), companylogo: 'iVBORw0KGgo='}

      expect(() => v.parse(vMemberRequest, body)).not.toThrow()
    })

    test('and the workorder logo the same way', () => {
      const body = {...member(), companylogo_workorder: 'iVBORw0KGgo='}

      expect(() => v.parse(vMemberRequest, body)).not.toThrow()
    })

    // The edit form PATCHes only what changed, so the logo travels alone.
    test('on its own in a PATCH body', () => {
      expect(() => v.parse(vPatchedMemberRequest, {companylogo: 'iVBORw0KGgo='}))
        .not.toThrow()
    })
  })
})

describe('Contract request schemas', () => {
  // The contract stores its modules as one string, but the API takes and
  // answers structured rows: a create needs at least one, a patch may leave
  // them out and keep the stored set, and rows stored before the endpoint
  // cared read back as an empty list rather than null.
  const ROWS = [{module: 1, parts: [2, 3]}]

  test('create requires at least one module path', () => {
    expect(() => v.parse(vContractCreateRequest, {name: 'Full'})).toThrow()
    expect(() => v.parse(vContractCreateRequest, {name: 'Full', module_paths: []})).toThrow()
    expect(() => v.parse(vContractCreateRequest, {name: 'Full', module_paths: ROWS})).not.toThrow()
  })

  test('update may omit it - the stored set stays', () => {
    expect(() => v.parse(vPatchedContractRequest, {name: 'Full'})).not.toThrow()
    expect(() => v.parse(vPatchedContractRequest, {name: 'Full', module_paths: ROWS})).not.toThrow()
  })

  test('neither write component accepts null or a string', () => {
    for (const schema of [vContractCreateRequest, vPatchedContractRequest]) {
      expect(() => v.parse(schema, {name: 'Full', module_paths: null})).toThrow()
      expect(() => v.parse(schema, {name: 'Full', module_paths: '1:2,3'})).toThrow()
    }
  })

  test('the read component answers rows, an empty list at least', () => {
    expect(() => v.parse(vContractWritable, {name: 'Full', module_paths: []})).not.toThrow()
    expect(() => v.parse(vContractWritable, {name: 'Full', module_paths: null})).toThrow()
  })
})
