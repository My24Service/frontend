import {describe, expect, test} from 'vitest'
import * as v from 'valibot'

import {
  vContractCreateWritable,
  vContractWritable,
  vMemberWritable,
  vPatchedMemberWritable,
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

      expect(() => v.parse(vMemberWritable, body)).not.toThrow()
    })

    // drf_extra_fields' Base64ImageField takes the payload with or without the
    // data URI preamble. While the field was declared `format: uri` the
    // generated client refused the bare form outright — a body the API would
    // have stored, rejected before it was sent.
    test('a bare base64 payload, which Base64ImageField also decodes', () => {
      const body = {...member(), companylogo: 'iVBORw0KGgo='}

      expect(() => v.parse(vMemberWritable, body)).not.toThrow()
    })

    test('and the workorder logo the same way', () => {
      const body = {...member(), companylogo_workorder: 'iVBORw0KGgo='}

      expect(() => v.parse(vMemberWritable, body)).not.toThrow()
    })

    // The edit form PATCHes only what changed, so the logo travels alone.
    test('on its own in a PATCH body', () => {
      expect(() => v.parse(vPatchedMemberWritable, {companylogo: 'iVBORw0KGgo='}))
        .not.toThrow()
    })
  })
})

describe('Contract request schemas', () => {
  // Contract.save() splits module_paths_pks on '|' and then on ':', so null,
  // '' and absent-on-create are all 500s rather than bodies the endpoint
  // accepts. The three cases below are the three the declaration now makes.

  test('create requires module_paths_pks', () => {
    expect(() => v.parse(vContractCreateWritable, {name: 'Full'})).toThrow()
    expect(() => v.parse(vContractCreateWritable, {name: 'Full', module_paths_pks: '1:2,3'}))
      .not.toThrow()
  })

  test('update may omit it — the stored value is what save() splits', () => {
    expect(() => v.parse(vContractWritable, {name: 'Full'})).not.toThrow()
  })

  test('neither direction accepts null or an empty string', () => {
    for (const schema of [vContractCreateWritable, vContractWritable]) {
      expect(() => v.parse(schema, {name: 'Full', module_paths_pks: null})).toThrow()
      expect(() => v.parse(schema, {name: 'Full', module_paths_pks: ''})).toThrow()
    }
  })
})
