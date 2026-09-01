import { beforeEach, describe, expect, test } from 'vitest'
import { HttpResponse } from 'msw'

import legacyClient from '@/services/api'
import { memberCompanycodeExistsRetrieve, memberContractCreate } from '@/api/sdk.gen'
import { vContract, vMember } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam } from '../support/api-seam/index.js'

/**
 * The seam's own contract: what it lets through, and what it refuses.
 *
 * Every assertion here is one of #318's acceptance criteria. They are worth
 * pinning because the seam's value is entirely in its strictness — a handler
 * set that quietly accepts anything is what the suite already had, and is what
 * let a list lose its pagination while staying green.
 */

const api = installApiSeam()

describe('the API seam intercepts both HTTP clients', () => {
  beforeEach(() => {
    api.get('/api/member/companycode-exists/', { available: true })
  })

  // The hand-written services reach the network through this one, with `/api`
  // in its baseURL rather than in the path.
  test('the legacy axios client', async () => {
    const response = await legacyClient.get('/member/companycode-exists/?companycode=acme')

    expect(response.data).toEqual({ available: true })
    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/member/companycode-exists/', query: { companycode: 'acme' }, body: undefined },
    ])
  })

  // The generated SDK carries `/api` in the operation's URL and serializes the
  // query itself. The seam sees the same request either way, which is the
  // property that lets a spec survive its call site being migrated.
  test('the generated SDK client', async () => {
    const response = await memberCompanycodeExistsRetrieve({ query: { companycode: 'acme' } })

    expect(response.data).toEqual({ available: true })
    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/member/companycode-exists/', query: { companycode: 'acme' }, body: undefined },
    ])
  })
})

describe('the API seam is strict', () => {
  test('a request to an undeclared path fails the test', async () => {
    await expect(legacyClient.get('/member/no-such-endpoint/')).rejects.toThrow()

    expect(api.takeViolations()).toEqual([
      expect.stringContaining('GET /api/member/no-such-endpoint/ is not declared'),
    ])
  })

  test('an undeclared query parameter fails the test', async () => {
    api.get('/api/member/companycode-exists/', { available: true })

    await legacyClient.get('/member/companycode-exists/?companycode=acme&sneaky=1')

    expect(api.takeViolations()).toEqual([
      expect.stringContaining("carries the query parameter 'sneaky'"),
    ])
  })

  test('a body that fails the request schema fails the test', async () => {
    api.post('/api/member/contract/', fixtureFor(vContract, { id: 1 }))

    // `name` is required on ContractCreate, and a number is not a string.
    await legacyClient.post('/member/contract/', { name: 42, module_paths_pks: '1' })

    expect(api.takeViolations()).toEqual([
      expect.stringContaining('sends a body its request schema rejects'),
    ])
  })

  test('a body the request schema accepts passes', async () => {
    api.post('/api/member/contract/', fixtureFor(vContract, { id: 1, name: 'Contract A' }))

    const body = { name: 'Contract A', module_paths_pks: '1' }

    await expect(memberContractCreate({ body })).resolves.toMatchObject({
      data: { id: 1, name: 'Contract A' },
    })
    expect(api.takeViolations()).toEqual([])
  })

  test('a declared path with no response registered fails the test', async () => {
    await expect(legacyClient.get('/member/vat-types/')).rejects.toThrow()

    expect(api.takeViolations()).toEqual([
      expect.stringContaining('has no response registered'),
    ])
  })

  // The document lists `/api/member/member/{id}/` above `/api/member/member/me/`,
  // and MSW answers with the first pattern that matches. In document order the
  // `:id` handler swallows every literal action path under it, so a stub for
  // `.../me/` would never be reached and the request would be judged against
  // the wrong operation's declared parameters.
  test('a literal action path is not shadowed by a path parameter above it', async () => {
    api.get('/api/member/member/me/', fixtureFor(vMember, { id: 7 }))

    const response = await legacyClient.get('/member/member/me/')

    expect(response.data).toMatchObject({ id: 7 })
    expect(api.takeViolations()).toEqual([])
  })

  // A repeated key is how the generated client serializes an array parameter,
  // and `?id=1&id=2` must not record the same as `?id=2`.
  test('a repeated query parameter keeps every value', async () => {
    api.get('/api/member/contract/', paginated([]))

    await legacyClient.get('/member/contract/?q=a&q=b')

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/member/contract/', query: { q: ['a', 'b'] }, body: undefined },
    ])
  })

  // Aimed at the spec, not at the code under test. A fixture the backend could
  // not have sent is a spec asserting behaviour against data that does not
  // exist — the same green-while-wrong failure one layer down, and the one that
  // would quietly turn #319's recorded goldens back into derived ones.
  test('a stubbed response the endpoint schema rejects fails the test', async () => {
    // A Contract without `modules_text`, `created` or `modified`. DRF cannot
    // send this, and hand-written fixtures look exactly like it.
    api.get('/api/member/contract/', paginated([{ id: 1, name: 'Contract A' }]))

    await legacyClient.get('/member/contract/')

    expect(api.takeViolations()).toEqual([
      expect.stringContaining('is stubbed with a response its own schema rejects'),
    ])
  })

  // The escape hatch a failure-path spec needs: an error envelope is not the
  // success schema, and #319 has to be able to drive save failures.
  test('an explicit HttpResponse opts out of response validation', async () => {
    api.get('/api/member/contract/', () =>
      HttpResponse.json({ detail: 'Not found.' }, { status: 404 }),
    )

    await expect(legacyClient.get('/member/contract/')).rejects.toThrow()

    expect(api.takeViolations()).toEqual([])
  })

  test('a stub for an endpoint the schema does not declare is refused where it is written', () => {
    expect(() => api.get('/api/member/no-such-endpoint/', {})).toThrow(
      /declares no GET \/api\/member\/no-such-endpoint\//,
    )
  })
})
