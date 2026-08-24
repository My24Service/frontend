import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * The dev-server half of the golden recorder.
 *
 * Two jobs: put `./browser.js` into the page, and accept what it captured and
 * write it into `tests/unit/golden/`.
 *
 * **Dev only, and off unless asked for.** It is added by `vite.config.js` when
 * `serve` is the command and `VITE_RECORD_GOLDENS` is set, so a normal dev
 * session is untouched and a production build cannot contain it — a route that
 * writes a file from an unauthenticated POST has no business existing anywhere
 * but on a developer's own machine.
 *
 * Goldens are keyed by scenario inside one file per screen, rather than one
 * file per scenario: a screen's scenarios are read together when someone is
 * working out what it does, and eight screens times nine paths is a directory
 * nobody can scan.
 */

const GOLDEN_DIR = 'tests/unit/golden'

/** Whether an address is this machine. Node reports IPv4 loopback as ::ffff:127.0.0.1. */
function isLoopback(address) {
  if (!address) return false
  const bare = address.replace(/^::ffff:/, '')
  return bare === '127.0.0.1' || bare === '::1' || bare.startsWith('127.')
}

export function goldenRecorder() {
  return {
    name: 'golden-recorder',
    apply: 'serve',

    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module', src: '/tests/recorder/browser.js' },
          injectTo: 'head',
        },
      ]
    },

    configureServer(server) {
      server.middlewares.use('/__golden', (request, response, next) => {
        if (request.method !== 'POST') return next()

        // Loopback only. The dev server binds 0.0.0.0 so a tenant host resolves,
        // which would otherwise put a route that writes a repo file from an
        // unauthenticated POST on every interface of the machine - and a golden
        // someone else wrote is a spec asserting requests the application never
        // made.
        if (!isLoopback(request.socket?.remoteAddress)) {
          response.statusCode = 403
          return response.end('the golden recorder only accepts requests from this machine')
        }

        const screen = decodeURIComponent(request.url.replace(/^\//, '').split('?')[0])
        if (!/^[a-z0-9-]+$/.test(screen)) {
          response.statusCode = 400
          return response.end(`bad screen name '${screen}' — use kebab-case`)
        }

        let raw = ''
        request.on('data', (chunk) => (raw += chunk))
        request.on('end', () => {
          try {
            const { scenario, requests } = JSON.parse(raw)
            const file = `${GOLDEN_DIR}/${screen}.json`
            const path = resolve(process.cwd(), file)

            let goldens = {}
            try {
              goldens = JSON.parse(readFileSync(path, 'utf8'))
            } catch {
              // First scenario for this screen.
            }

            goldens[scenario] = requests

            mkdirSync(dirname(path), { recursive: true })
            // Sorted, so re-recording one scenario cannot reorder the file and
            // turn a one-line change into an unreviewable diff.
            const sorted = Object.fromEntries(
              Object.keys(goldens)
                .sort()
                .map((key) => [key, goldens[key]]),
            )
            writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`)

            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ file, scenario, count: requests.length }))
          } catch (error) {
            response.statusCode = 400
            response.end(String(error))
          }
        })
      })
    },
  }
}
