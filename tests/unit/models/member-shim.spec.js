import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { vMemberWritable } from '@/api/valibot.gen'
import * as memberModule from '@/models/member/Member.js'

/**
 * The Member-model Shim (#326).
 *
 * The hand-written Member service and model died at #326. What four screens
 * outside the Slice still needed from that file was default field shapes —
 * nothing more — so the file survives as a Shim: two helpers deriving their
 * defaults from the generated request schema, and nothing else on the export
 * list. This suite pins all three claims:
 *
 *   - the export list is only the Shim's (the service and model are gone);
 *   - the defaults are the schema's, field for field (nothing restated, so a
 *     backend field addition shows up here without anyone editing this file);
 *   - `memberShape` merges overrides the way `new MemberModel(overrides)` did.
 *
 * The one stated override is `is_public: true`, carried over from the legacy
 * field bag: a new member is public until someone says otherwise. It is a UI
 * decision, which is exactly what {@link formDefaults}'s overrides are for —
 * and its unknown-key check is what turns a backend rename into a loud import
 * failure instead of a silently empty form.
 */

describe('the Shim’s export list', () => {
  test('is exactly the two default-shape helpers', () => {
    expect(Object.keys(memberModule).sort()).toEqual([
      'memberFieldDefaults',
      'memberShape',
    ])
  })
})

describe('memberFieldDefaults', () => {
  test('covers every field of the generated writable schema, and no others', () => {
    const defaults = memberModule.memberFieldDefaults()

    expect(Object.keys(defaults).sort()).toEqual(Object.keys(vMemberWritable.entries).sort())
  })

  test('derives each blank from the schema’s type', () => {
    const defaults = memberModule.memberFieldDefaults()

    // Required strings blank out...
    expect(defaults.name).toBe('')
    expect(defaults.companycode).toBe('')
    // ...nullable scalars to null...
    expect(defaults.fax).toBeNull()
    expect(defaults.contract).toBeNull()
    // ...and booleans to false, except the one domain decision the legacy bag
    // made: a new member is public.
    expect(defaults.has_branches).toBe(false)
    expect(defaults.is_public).toBe(true)
  })

  test('hands back a fresh object every call', () => {
    const one = memberModule.memberFieldDefaults()
    one.name = 'mutated'

    expect(memberModule.memberFieldDefaults().name).toBe('')
  })
})

describe('memberShape', () => {
  test('merges overrides over the defaults, as `new MemberModel(...)` did', () => {
    const shape = memberModule.memberShape({ name: 'SHLTR', companycode: 'shltr' })

    expect(shape.name).toBe('SHLTR')
    expect(shape.companycode).toBe('shltr')
    // Everything else keeps its derived blank.
    expect(shape.address).toBe('')
    expect(shape.is_public).toBe(true)
  })

  test('does not mutate the defaults it starts from', () => {
    memberModule.memberShape({ name: 'changed' })

    expect(memberModule.memberFieldDefaults().name).toBe('')
  })

  test('passes record keys through unchecked, as the old constructor did', () => {
    // QuotationView hands this the tenant's FULL stored record - id,
    // settings, audit timestamps - and every key must survive the merge,
    // exactly as `new MemberModel(record)` let it.
    const shape = memberModule.memberShape({ id: 19, settings: { theme: 'dark' } })

    expect(shape.id).toBe(19)
    expect(shape.settings).toEqual({ theme: 'dark' })
  })

  test('every derived blank is legal input to the request schema — bar the unblankable', () => {
    // The whole point of deriving from the writable schema: what the Shim
    // hands a caller fits what the API accepts. The two exceptions are the
    // format-validated strings — an empty string is not a URL or an email,
    // and no blank could be — exactly the fields the rewritten Member form
    // already refuses to submit empty.
    const result = v.safeParse(vMemberWritable, memberModule.memberShape())

    expect(result.success).toBe(false)
    expect(result.issues.map((issue) => issue.path?.[0]?.key).sort()).toEqual(['email', 'www'])
  })
})
