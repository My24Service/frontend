import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {client} from '@/api/client.gen'
import {installApiInterceptors, resetCsrfToken} from '@/services/api-client/interceptors'
import {orderCostCreate, orderCostList} from '@/api/sdk.gen'
import {useAuthToken} from '@/features/auth/token'
import {fixtureFor} from '../helpers/schema-fixture'
import {vOrderCost, vOrderCostWritable} from '@/api/valibot.gen'

// The generated client has its own axios instance, so everything the app's
// hand-written client does through interceptors — bearer token, 401 redirect,
// CSRF on writes — has to be attached to it explicitly. These pin that it is,
// because the failure mode is silent: a migrated model would simply start
// sending unauthenticated, CSRF-less requests.

let adapter

beforeEach(() => {
  // Logged in through the one token source, not by writing localStorage behind
  // it. Every consumer resolves the token from that ref - the bearer header
  // these specs exercise included - and the storage entry is only a copy that
  // follows it a tick later (see src/features/auth/token.ts). Seeding the entry
  // directly would assert the accident that the ref has not been read yet, and
  // would stop describing a logged-in session the moment that stopped holding.
  useAuthToken().value = 'a-token'
  resetCsrfToken()

  // Intercept at the axios adapter, below the interceptor chain, so what is
  // asserted is the request as it would go on the wire.
  adapter = vi.fn(async (config) => {
    const data = config.url.includes('get-csrf-token')
      ? {token: 'csrf-42'}
      : config.method === 'post'
        ? fixtureFor(vOrderCost, {id: 1})
        : {count: 0, next: null, previous: null, results: []}

    return {data, status: 200, statusText: 'OK', headers: {}, config}
  })
  client.instance.defaults.adapter = adapter

  installApiInterceptors()
})

afterEach(() => {
  // Log out the same way, for the same reason: clearing the ref is what ends
  // the session, and the entry behind it follows.
  useAuthToken().value = null
})

const sent = () => adapter.mock.calls.map(([config]) => config)

/** A valid POST body — the SDK validates it before any interceptor runs. */
const costBody = () => fixtureFor(vOrderCostWritable, {order: 1, cost_type: 'distance'})

describe('generated client interceptors', () => {
  test('the baseURL is set before anything installs anything', () => {
    // From createClientConfig, applied as the client was constructed — not
    // from a setConfig() call some module has to remember to make.
    expect(client.getConfig().baseURL).toBeTruthy()
    expect(client.buildUrl({url: '/api/order/cost/'})).toContain('/api/order/cost/')
  })

  test('a generated GET carries the Authorization header', async () => {
    await orderCostList({throwOnError: true})

    expect(sent()[0].headers.Authorization).toBe('Bearer a-token')
  })

  test('a request from a logged-out session carries no Authorization header', async () => {
    useAuthToken().value = null

    await orderCostList({throwOnError: true})

    // Nothing seeded this spec's storage, so a header here could only come from
    // the token ref - the same source the request path reads.
    expect(sent()[0].headers.Authorization).toBeUndefined()
  })

  test('a generated write fetches a CSRF token and sends it', async () => {
    await orderCostCreate({body: costBody(), throwOnError: true})

    const [csrfRequest, postRequest] = sent()
    expect(csrfRequest.url).toContain('/api/get-csrf-token/')
    expect(postRequest.method).toBe('post')
    expect(postRequest.headers['X-CSRFToken']).toBe('csrf-42')
    // And the auth interceptor did not clobber it on the way past.
    expect(postRequest.headers.Authorization).toBe('Bearer a-token')
  })

  test('the CSRF token is fetched once, not per write', async () => {
    await orderCostCreate({body: costBody(), throwOnError: true})
    await orderCostCreate({body: costBody(), throwOnError: true})

    // BaseModel#insert fetched one per call; three requests here, not four.
    expect(sent().filter((config) => config.url.includes('get-csrf-token'))).toHaveLength(1)
  })

  test('a read does not fetch a CSRF token at all', async () => {
    await orderCostList({throwOnError: true})

    expect(sent()).toHaveLength(1)
  })

  test('installing twice does not stack interceptors', async () => {
    installApiInterceptors()
    installApiInterceptors()

    await orderCostCreate({body: costBody(), throwOnError: true})

    // One token fetch and one POST — a duplicated interceptor would show up
    // here as an extra round-trip per write.
    expect(sent()).toHaveLength(2)
  })
})
