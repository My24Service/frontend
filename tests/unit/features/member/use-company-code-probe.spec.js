import { beforeEach, describe, expect, test } from 'vitest'
import { computed, defineComponent, h, nextTick, ref } from 'vue'

import { useCompanyCodeProbe } from '@/features/member/member/use-company-code-probe'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { serverError } from '../../support/list-harness.js'
import { mountListView } from '../../support/form-harness.js'

/**
 * The company-code probe, directly.
 *
 * This is the subtlest logic in the Slice — a debounced, race-guarded,
 * save-blocking state machine — and it used to live inline in MemberForm.vue,
 * where only the member-form spec exercised it, incidentally. These specs pin
 * each piece of bookkeeping for its own sake, through the strict seam so the
 * request itself is held to the schema:
 *
 *   - the debounce is real: a fresh keystroke inside the window replaces the
 *     pending ask instead of adding one, and a short or unchanged code never
 *     asks at all — asserted after waiting *past* the window, because an
 *     assertion of silence made too early proves nothing;
 *   - a stale answer never speaks over the current one;
 *   - the save barrier (`waitForProbe`) exists from the first owed keystroke
 *     and resolves when that probe lands, not before.
 *
 * The production debounce is half a second (#325); these specs inject a
 * five-millisecond one rather than sleeping through the real thing.
 */

const api = installApiSeam()

/** Long enough to be safely past the injected five-millisecond window. */
const PAST_THE_WINDOW_MS = 60

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let probeHarness

const ProbeHarness = defineComponent({
  props: {original: {type: String, default: null}},
  setup(props) {
    const code = ref('')
    const probe = useCompanyCodeProbe(
      () => code.value,
      computed(() => props.original),
      {debounceMs: 5},
    )
    probeHarness = {code, probe}
    return () => h('div')
  },
})

async function typeCode(code) {
  probeHarness.code.value = code
  await nextTick()
}

async function mountProbe(props = {}) {
  const wrapper = await mountListView(ProbeHarness, {props})
  return wrapper
}

beforeEach(() => {
  api.get('/api/member/companycode-exists/', {available: false})
})

describe('useCompanyCodeProbe, what owes a verdict', () => {
  test('a two-character code asks exactly once, after the pause', async () => {
    await mountProbe()

    await typeCode('ab')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    const probes = api.requests().filter((sent) => sent.path === '/api/member/companycode-exists/')
    expect(probes).toHaveLength(1)
    expect(probes[0].query).toEqual({companycode: 'ab'})

    // And the settled state stays put; no further asks appear.
    await pause(PAST_THE_WINDOW_MS)
    expect(api.requests().filter((sent) => sent.path === '/api/member/companycode-exists/')).toHaveLength(1)
  })

  test('a short code never asks, even long after the window', async () => {
    await mountProbe()

    await typeCode('a')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    expect(api.requests().filter((sent) => sent.path === '/api/member/companycode-exists/')).toEqual([])
    expect(probeHarness.probe.state.value).toBe('idle')
  })

  test('the code the record already owns never asks', async () => {
    await mountProbe({original: 'KEPT'})

    await typeCode('KEPT')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    expect(api.requests().filter((sent) => sent.path === '/api/member/companycode-exists/')).toEqual([])
  })
})

describe('useCompanyCodeProbe, the verdict', () => {
  test('a taken code paints the field red', async () => {
    await mountProbe()

    await typeCode('ab')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    expect(probeHarness.probe.state.value).toBe('taken')
    expect(probeHarness.probe.validationState.value).toBe(false)
  })

  test('an available code paints the field green', async () => {
    api.get('/api/member/companycode-exists/', {available: true})
    await mountProbe()

    await typeCode('free')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    expect(probeHarness.probe.state.value).toBe('available')
    expect(probeHarness.probe.validationState.value).toBe(true)
  })

  test('a failed probe claims nothing rather than guessing', async () => {
    // The generated SDK reports an HTTP failure as `{error}`, not a throw —
    // so no verdict is recorded and the field keeps its neutral colour. Only
    // a network-level exception reaches the catch that resets to idle.
    api.get('/api/member/companycode-exists/', serverError)
    await mountProbe()

    await typeCode('ab')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    expect(probeHarness.probe.state.value).not.toBe('available')
    expect(probeHarness.probe.state.value).not.toBe('taken')
    expect(probeHarness.probe.validationState.value).toBeUndefined()
  })
})

describe('useCompanyCodeProbe, the timing', () => {
  test('typing again inside the window replaces the ask instead of adding one', async () => {
    await mountProbe()

    await typeCode('ab')
    await typeCode('abc')
    await pause(PAST_THE_WINDOW_MS)
    await settle()

    const probes = api.requests().filter((sent) => sent.path === '/api/member/companycode-exists/')
    expect(probes).toHaveLength(1)
    expect(probes[0].query).toEqual({companycode: 'abc'})
  })

  test('waitForProbe holds until the answer for the current code has landed', async () => {
    let release
    api.get('/api/member/companycode-exists/', () => new Promise((resolve) => {release = resolve}))
    await mountProbe()

    await typeCode('ab')
    await pause(PAST_THE_WINDOW_MS)

    // Asked and unanswered: checking, and the barrier still held.
    expect(api.requests()).toHaveLength(1)
    expect(probeHarness.probe.state.value).toBe('checking')

    const barrier = probeHarness.probe.waitForProbe()
    let settled = false
    void barrier.then(() => {settled = true})
    await settle()
    expect(settled).toBe(false)

    release({available: true})
    await settle()
    await barrier

    expect(settled).toBe(true)
    expect(probeHarness.probe.state.value).toBe('available')
  })
})
