import { beforeEach, describe, expect, test } from 'vitest'
import { computed, defineComponent, h, nextTick, ref } from 'vue'

import { useUsernameProbe } from '@/features/user/use-username-probe'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { serverError } from '../../support/list-harness.js'
import { mountForm } from '../../support/form-harness.js'

const api = installApiSeam()

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

beforeEach(() => {
  api.get('/api/company/username-exists/', { available: true })
})

/** The probe's requests, as the strict seam saw them on the wire. */
function probes() {
  return api.requests().filter((sent) => sent.path === '/api/company/username-exists/')
}

describe('useUsernameProbe, what owes a verdict', () => {
  test('a typed name asks exactly once, after the pause', async () => {
    await mountProbe()

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    const sent = probes()
    expect(sent).toHaveLength(1)
    expect(sent[0].query).toEqual({ username: 'jan' })
  })

  test('an empty name never asks, even long after the window', async () => {
    await mountProbe()

    await typeUsername('')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    expect(probes()).toEqual([])
    expect(probeHarness.probe.state.value).toBe('idle')
  })

  test('the name the record already owns never asks', async () => {
    await mountProbe({ original: 'jan' })

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    expect(probes()).toEqual([])
    expect(probeHarness.probe.state.value).toBe('idle')
  })

  test('an available name reads green, a taken name reads red', async () => {
    await mountProbe()

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)
    await settle()
    expect(probeHarness.probe.state.value).toBe('available')
    expect(probeHarness.probe.validationState.value).toBe(true)

    api.get('/api/company/username-exists/', { available: false })
    await typeUsername('piet')
    await pause(PAST_THE_WINDOW_MS)
    await settle()
    expect(probeHarness.probe.state.value).toBe('taken')
    expect(probeHarness.probe.validationState.value).toBe(false)
  })

  test('a failed probe reads idle, not stuck on checking', async () => {
    api.get('/api/company/username-exists/', serverError)
    await mountProbe()

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    expect(probeHarness.probe.state.value).toBe('idle')
  })
})

describe('useUsernameProbe, the encoding', () => {
  test('a plus in the name reaches the wire encoded, not as a space', async () => {
    await mountProbe()

    await typeUsername('jan+jansen')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    const sent = probes()
    expect(sent).toHaveLength(1)
    // Key for key: a query object the client serialized. A literal '+' is
    // decoded to a space by the seam's URL parser, so this reads 'jan+jansen'
    // only while the value is percent-encoded.
    expect(sent[0].method).toBe('get')
    expect(sent[0].query).toEqual({ username: 'jan+jansen' })
  })
})

describe('useUsernameProbe, the race', () => {
  test('a stale answer never releases the barrier for the current name', async () => {
    const releases = []
    api.get('/api/company/username-exists/', () => new Promise((resolve) => { releases.push(resolve) }))
    await mountProbe()

    await typeUsername('jan')
    await pause(PAST_THE_WINDOW_MS)
    expect(probes()).toHaveLength(1)

    await typeUsername('jan+piet')
    await pause(PAST_THE_WINDOW_MS)
    await settle()
    expect(probes()).toHaveLength(2)

    const barrier = probeHarness.probe.waitForProbe()
    let settled = false
    void barrier.then(() => { settled = true })
    await settle()
    expect(settled).toBe(false)

    releases[0]({ available: true })
    await settle()

    expect(settled).toBe(false)
    expect(probeHarness.probe.state.value).toBe('checking')

    releases[1]({ available: false })
    await barrier
    expect(settled).toBe(true)
    expect(probeHarness.probe.state.value).toBe('taken')
  })
})
