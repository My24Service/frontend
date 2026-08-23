import {describe, expect, test} from 'vitest'
import {createApp, defineComponent, h} from 'vue'
import {useQueryClient} from '@tanstack/vue-query'

import {installQueryClient, queryClientOptions} from '@/services/query-client'

// The generated query options in src/api/@tanstack/ have never been usable,
// because the plugin was never installed: `useQueryClient()` throws without it.
// These pin the installation itself, not any screen — nothing calls the client
// yet, so the only thing that can regress is application startup.

/** Mounts a component under an app that has the plugin installed. */
const mountWithPlugin = (setup) => {
  const root = document.createElement('div')
  const app = createApp(defineComponent({setup, render: () => h('div')}))

  installQueryClient(app)
  app.mount(root)

  return () => app.unmount()
}

describe('installQueryClient', () => {
  test('makes a query client resolvable from a component', () => {
    let client

    const unmount = mountWithPlugin(() => {
      client = useQueryClient()
    })

    expect(client).toBeDefined()
    expect(typeof client.getQueryData).toBe('function')

    unmount()
  })

  test('applies the app-wide defaults to the installed client', () => {
    let defaults

    const unmount = mountWithPlugin(() => {
      defaults = useQueryClient().getDefaultOptions()
    })

    expect(defaults.queries).toMatchObject(queryClientOptions.queryClientConfig.defaultOptions.queries)

    unmount()
  })

  test('does not retry a request the server rejected as a client error', () => {
    const {retry} = queryClientOptions.queryClientConfig.defaultOptions.queries

    expect(retry(0, {response: {status: 404}})).toBe(false)
    expect(retry(0, {response: {status: 403}})).toBe(false)
    expect(retry(0, {response: {status: 503}})).toBe(true)
    expect(retry(0, new Error('network down'))).toBe(true)
  })

  test('gives up after a bounded number of retries', () => {
    const {retry} = queryClientOptions.queryClientConfig.defaultOptions.queries

    expect(retry(1, {response: {status: 503}})).toBe(true)
    expect(retry(2, {response: {status: 503}})).toBe(false)
  })
})
