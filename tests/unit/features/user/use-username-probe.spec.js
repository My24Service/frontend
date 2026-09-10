import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, ref } from 'vue'

import client from '@/services/api'
import { useUsernameProbe } from '@/features/user/use-username-probe'

import { mountForm } from '../../support/form-harness.js'

const PAST_THE_WINDOW_MS = 60

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let probeHarness

const ProbeHarness = defineComponent({
  props: { original: { type: String, default: null } },
  setup(props) {
    const username = ref('')
    const probe = useUsernameProbe(
      () => username.value,
      computed(() => props.original),
      { debounceMs: 5 },
    )
    probeHarness = { username, probe }
    return () => h('div')
  },
})

async function typeUsername(value) {
  probeHarness.username.value = value
  await nextTick()
}

async function mountProbe(props = {}) {
  const wrapper = mountForm(ProbeHarness, { props })
  await pause(PAST_THE_WINDOW_MS)
  return wrapper
}

// The probe rides the shared axios instance directly — outside the strict
// seam, like the legacy helper it replaces. Answer it at the instance the
// probe actually reads, and put the real client back between specs: the
// instance is module state shared with every other spec in the file.
let realGet

beforeEach(() => {
  realGet = client.get
  client.get = vi.fn(() => Promise.resolve({ data: { available: true } }))
})

afterEach(() => {
  client.get = realGet
})

function probeCalls() {
  return client.get.mock.calls.filter(([url]) => String(url).includes('username-exists'))
}

function probeParams() {
  return probeCalls().map(([, config]) => config?.params)
}

describe('useUsernameProbe, what owes a verdict', () => {
  test('a typed name asks exactly once, after the pause', async () => {
    await mountProbe()

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)

    expect(probeCalls()).toHaveLength(1)
    expect(probeParams()[0]).toEqual({ username: 'jan' })
  })

  test('an empty name never asks, even long after the window', async () => {
    await mountProbe()

    await typeUsername('')
    await pause(PAST_THE_WINDOW_MS)

    expect(probeCalls()).toEqual([])
    expect(probeHarness.probe.state.value).toBe('idle')
  })

  test('the name the record already owns never asks', async () => {
    await mountProbe({ original: 'jan' })

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)

    expect(probeCalls()).toEqual([])
    expect(probeHarness.probe.state.value).toBe('idle')
  })

  test('an available name reads green, a taken name reads red', async () => {
    await mountProbe()

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)
    expect(probeHarness.probe.state.value).toBe('available')
    expect(probeHarness.probe.validationState.value).toBe(true)

    client.get.mockResolvedValueOnce({ data: { available: false } })
    await typeUsername('piet')
    await pause(PAST_THE_WINDOW_MS)
    expect(probeHarness.probe.state.value).toBe('taken')
    expect(probeHarness.probe.validationState.value).toBe(false)
  })

  test('a failed probe reads idle, not stuck on checking', async () => {
    await mountProbe()

    client.get.mockRejectedValueOnce(new Error('boom'))
    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)

    expect(probeHarness.probe.state.value).toBe('idle')
  })
})

describe('useUsernameProbe, the encoding', () => {
  test('a plus in the name rides params, not a concatenated query string', async () => {
    await mountProbe()

    await typeUsername('jan+jansen')
    await pause(PAST_THE_WINDOW_MS)

    expect(probeCalls()).toHaveLength(1)
    expect(probeParams()[0]).toEqual({ username: 'jan+jansen' })
    expect(String(probeCalls()[0][0])).not.toContain('username=')
  })
})

describe('useUsernameProbe, the race', () => {
  test('a stale answer never releases the barrier for the current name', async () => {
    await mountProbe()

    const releases = []
    client.get.mockImplementation(() => new Promise((resolve) => { releases.push(resolve) }))

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)
    expect(probeCalls()).toHaveLength(1)

    await typeUsername('jan+piet')
    await pause(PAST_THE_WINDOW_MS)
    expect(probeCalls()).toHaveLength(2)

    const barrier = probeHarness.probe.waitForProbe()
    let settled = false
    void barrier.then(() => { settled = true })
    await pause(10)
    expect(settled).toBe(false)

    releases[0]({ data: { available: true } })
    await pause(PAST_THE_WINDOW_MS)

    expect(settled).toBe(false)
    expect(probeHarness.probe.state.value).toBe('checking')

    releases[1]({ data: { available: false } })
    await barrier
    expect(settled).toBe(true)
    expect(probeHarness.probe.state.value).toBe('taken')
  })
})
