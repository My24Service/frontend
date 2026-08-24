/**
 * The recorder, in the browser.
 *
 * Injected into the dev server's index.html by `./vite-plugin.js`, and only in
 * dev. Nothing in `src/` imports it, so the application it records is the
 * application as shipped.
 *
 * It patches `XMLHttpRequest` and `fetch` — below both HTTP clients, the same
 * boundary the test seam intercepts at, and for the same reason. A recording
 * taken above a client would record whatever that client was asked to do
 * rather than what went on the wire, which is the failure #313 is about.
 *
 * Requests are written down by `../unit/support/api-seam/normalize.js`, which
 * the seam also uses. Neither side keeps its own copy of that, so a golden
 * cannot fail against the seam for a reason that is really a disagreement
 * about how to spell a query string.
 *
 * Usage, from the browser console with the screen open and a staff session:
 *
 *     golden.start()                       // begin recording
 *     …drive the screen…
 *     await golden.save('member-list', 'initial load')
 *
 * `save` POSTs to the dev server, which writes
 * `tests/unit/golden/member-list.json` with that scenario key. `golden.show()`
 * prints what has been captured without saving, which is how you check you
 * recorded the interaction you meant to.
 */

import { CSRF_PATH, decodeBody, entryFor } from '../unit/support/api-seam/normalize.js'

const captured = []
let recording = false

function record(method, rawUrl, contentType, rawBody) {
  if (!recording) return

  const url = new URL(rawUrl, window.location.origin)

  // The CSRF handshake precedes every write and belongs to no screen's call
  // shape. The seam leaves it out of its recording too; a golden that carried
  // it would fail against the seam for saying something true but irrelevant.
  if (url.pathname === CSRF_PATH) return

  // The dev server's own traffic is not the application talking to the API.
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/__golden')) return
  if (!url.pathname.startsWith('/api/')) return

  const { body } = decodeBody(contentType, rawBody)
  captured.push(entryFor(method, url, body))
}

const NativeXHR = window.XMLHttpRequest
const nativeOpen = NativeXHR.prototype.open
const nativeSend = NativeXHR.prototype.send
const nativeSetHeader = NativeXHR.prototype.setRequestHeader

NativeXHR.prototype.open = function (method, url, ...rest) {
  this.__golden = { method, url, contentType: '' }
  return nativeOpen.call(this, method, url, ...rest)
}

NativeXHR.prototype.setRequestHeader = function (name, value) {
  if (this.__golden && name.toLowerCase() === 'content-type') {
    this.__golden.contentType = value
  }
  return nativeSetHeader.call(this, name, value)
}

NativeXHR.prototype.send = function (body) {
  const call = this.__golden
  if (call) {
    // axios defaults to url-encoded when it is given a string and no explicit
    // header, which is exactly the case `decodeBody` has to be told about.
    const contentType =
      call.contentType || (typeof body === 'string' ? 'application/x-www-form-urlencoded' : '')
    record(call.method, call.url, contentType, typeof body === 'string' ? body : undefined)
  }
  return nativeSend.call(this, body)
}

const nativeFetch = window.fetch
window.fetch = async function (input, init = {}) {
  const request = input instanceof Request ? input : null
  const url = request ? request.url : String(input)
  const method = init.method ?? request?.method ?? 'GET'
  const contentType =
    new Headers(init.headers ?? request?.headers ?? {}).get('content-type') ?? ''

  let body
  if (typeof init.body === 'string') body = init.body
  else if (request) body = await request.clone().text()

  record(method, url, contentType, body)

  return nativeFetch.call(this, input, init)
}

window.golden = {
  /** Begin recording, discarding anything captured before now. */
  start() {
    captured.length = 0
    recording = true
    console.log('[golden] recording — drive the screen, then golden.save(screen, scenario)')
  },

  /** Stop recording without saving. */
  stop() {
    recording = false
    return captured.length
  },

  /** What has been captured so far, without saving it. */
  show() {
    console.log(JSON.stringify(captured, null, 2))
    return captured
  },

  /**
   * Write what has been captured into `tests/unit/golden/<screen>.json` under
   * `scenario`, and stop recording.
   *
   * Saving an empty recording is refused. An interaction that put nothing on
   * the wire is nearly always a recording that was never started, and a golden
   * of `[]` would assert that a screen makes no requests — green, and wrong in
   * the direction this whole apparatus exists to prevent.
   */
  async save(screen, scenario) {
    recording = false

    if (!screen || !scenario) throw new Error('golden.save(screen, scenario) needs both')
    if (!captured.length) {
      throw new Error('nothing was captured — call golden.start() before driving the screen')
    }

    const response = await nativeFetch('/__golden/' + encodeURIComponent(screen), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, requests: captured }),
    })

    if (!response.ok) throw new Error('[golden] save failed: ' + (await response.text()))

    const written = await response.json()
    console.log(`[golden] wrote ${captured.length} request(s) to ${written.file} as "${scenario}"`)
    return written
  },
}

console.log('[golden] recorder ready — golden.start() to begin')
