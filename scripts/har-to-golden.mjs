#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

import { CSRF_PATH, decodeBody, entryFor } from '../tests/unit/support/api-seam/normalize.js'

/**
 * Turn a browser HAR capture into a recorded golden.
 *
 * A golden is the set of requests a screen puts on the wire, and it has to come
 * from the running application against a real tenant — not from reading the
 * component. A golden derived by reading the code cannot disagree with the
 * code, so it certifies whatever the code does, including a dropped query
 * parameter (#313).
 *
 * The source is a HAR because a HAR needs no cooperation from this repository
 * and no credentials in a script: DevTools captures it and the file *is* the
 * recording. The previous attempt built a recorder into the dev server, which
 * still needed a working application and a staff login, so nothing was ever
 * recorded with it.
 *
 * Requests are written down by `tests/unit/support/api-seam/normalize.js`,
 * which is also what the seam uses when it watches a spec. Neither side keeps
 * its own copy: if they spelled a query string or a form body differently,
 * every recorded golden would fail for a reason that has nothing to do with the
 * application, and the obvious repair would be to edit the golden until it
 * matched the seam — deriving it from the code again by a slower route.
 *
 * Usage:
 *
 *   npm run golden -- <file.har>
 *       List the API calls in the capture, numbered.
 *
 *   npm run golden -- <file.har> --screen module-list \
 *       --scenario "initial load" --entries 0
 *       Write those entries into tests/unit/golden/module-list.json.
 *
 *   npm run golden -- --todo
 *       List the scenarios the specs ask for and the goldens do not have.
 *
 * `--entries` is required and takes indices or ranges (`0`, `0,2`, `1-4`).
 * The tool does not guess where one scenario ends and the next begins: a
 * capture usually holds several, and only the person who did the clicking
 * knows which requests were which. Guessing the boundary would be one more
 * way of deriving the golden.
 */

const GOLDEN_DIR = resolve(process.cwd(), 'tests/unit/golden')
const SPEC_DIR = resolve(process.cwd(), 'tests/unit/views/member')

function main(argv) {
  const options = parseArgs(argv)

  if (options.todo) return reportTodo()

  if (!options.har) return usage('a .har file is required')

  const calls = apiCallsOf(readHar(options.har))

  if (!calls.length) {
    return fail(
      `no /api/ requests in ${options.har}.\n` +
        `A capture taken with the Network panel filtered to "Doc" or "JS" will look like this — ` +
        `re-take it with no filter, or with Fetch/XHR selected.`,
    )
  }

  if (!options.screen && !options.scenario && !options.entries) return list(calls)

  if (!options.screen || !options.scenario || !options.entries) {
    return usage('--screen, --scenario and --entries go together')
  }

  write(calls, options)
}

/* -------------------------------------------------------------- reading */

function readHar(path) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(resolve(path), 'utf8'))
  } catch (error) {
    return fail(`could not read ${path} as JSON: ${error.message}`)
  }

  const entries = parsed?.log?.entries
  if (!Array.isArray(entries)) return fail(`${path} is not a HAR: no log.entries array`)
  return entries
}

/**
 * The entries that are the application talking to the API, normalized.
 *
 * Four things are dropped, and each of them would otherwise put a request in a
 * golden that the seam will never see:
 *
 *   - anything outside `/api/`. Assets, the document, HMR, source maps. The app
 *     and the API are different origins in development (`:3000` and `:8000`),
 *     so the path is the test, not the host.
 *   - CORS preflights. Because the API *is* a different origin, every XHR is
 *     preceded by an `OPTIONS` the browser sent on its own. The application did
 *     not make that request and neither does the seam.
 *   - the CSRF handshake, which precedes every write and belongs to no screen's
 *     call shape. The seam leaves it out too.
 *   - anything the browser served from cache without asking, which has no
 *     bearing on what the code requested.
 */
function apiCallsOf(entries) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => {
      const { method, url } = entry.request
      if (method === 'OPTIONS' || entry._resourceType === 'preflight') return false

      let parsed
      try {
        parsed = new URL(url)
      } catch {
        return false
      }

      if (!parsed.pathname.startsWith('/api/')) return false
      return parsed.pathname !== CSRF_PATH
    })
    .map(({ entry, index }, position) => {
      const url = new URL(entry.request.url)
      const post = entry.request.postData
      const { body } = decodeBody(post?.mimeType, post?.text ?? '')

      return {
        position,
        harIndex: index,
        startedDateTime: entry.startedDateTime,
        status: entry.response?.status,
        golden: entryFor(entry.request.method, url, body),
      }
    })
}

/* -------------------------------------------------------------- output */

function list(calls) {
  console.log(`${calls.length} API call(s) in the capture:\n`)
  for (const call of calls) {
    const { method, path, query, body } = call.golden
    const search = Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''
    console.log(`  [${call.position}] ${method.toUpperCase()} ${path}${search}`)
    if (body !== undefined) console.log(`        body ${JSON.stringify(body)}`)
  }
  console.log(
    `\nPick the ones belonging to one scenario:\n` +
      `  npm run golden -- <file.har> --screen <screen> --scenario "<scenario>" --entries 0`,
  )
}

function write(calls, { screen, scenario, entries, force }) {
  if (!/^[a-z0-9-]+$/.test(screen)) return fail(`bad --screen '${screen}': use kebab-case`)

  const known = scenariosAskedFor()
  if (!force && !known.some((one) => one.screen === screen && one.scenario === scenario)) {
    return fail(
      `no spec asks for "${scenario}" on ${screen}.\n` +
        `A golden nothing reads leaves the scenario skipping while looking recorded, which is ` +
        `the failure this whole apparatus exists to prevent.\n` +
        `Run with --todo to see what is outstanding, or --force if the spec is coming later.`,
    )
  }

  const chosen = selectionOf(entries, calls)
  if (!chosen.length) return fail(`--entries ${entries} selected nothing`)

  const path = resolve(GOLDEN_DIR, `${screen}.json`)
  let goldens = {}
  try {
    goldens = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    // First scenario for this screen.
  }

  goldens[scenario] = chosen.map((call) => call.golden)

  // Sorted, so re-recording one scenario cannot reorder the file and turn a
  // one-line change into an unreviewable diff.
  const sorted = Object.fromEntries(
    Object.keys(goldens)
      .sort()
      .map((key) => [key, goldens[key]]),
  )

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`)

  console.log(`wrote ${chosen.length} request(s) to tests/unit/golden/${screen}.json as "${scenario}":`)
  for (const call of chosen) {
    const { method, path: requestPath, query } = call.golden
    const search = Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''
    console.log(`  ${method.toUpperCase()} ${requestPath}${search}`)
  }
}

function selectionOf(spec, calls) {
  const wanted = new Set()

  for (const part of spec.split(',')) {
    const range = part.trim().match(/^(\d+)-(\d+)$/)
    if (range) {
      for (let i = Number(range[1]); i <= Number(range[2]); i++) wanted.add(i)
      continue
    }
    const single = part.trim().match(/^\d+$/)
    if (!single) return fail(`bad --entries '${part.trim()}': use 0, 0,2 or 1-4`)
    wanted.add(Number(part.trim()))
  }

  for (const index of wanted) {
    if (!calls.some((call) => call.position === index)) {
      return fail(`--entries names [${index}], but the capture has ${calls.length} API call(s)`)
    }
  }

  // In capture order, whatever order the indices were given in: a golden is a
  // sequence, and the seam records the sequence the application produced.
  return calls.filter((call) => wanted.has(call.position))
}

/* -------------------------------------------------------------- outstanding */

/** Every `(screen, scenario)` the specs ask for, read out of the goldenTest calls. */
function scenariosAskedFor() {
  const asked = []

  for (const file of readdirSync(SPEC_DIR).filter((name) => name.endsWith('.spec.js'))) {
    const source = readFileSync(resolve(SPEC_DIR, file), 'utf8')
    const pattern = /goldenTest\(\s*goldens\s*,\s*'([^']+)'\s*,\s*'([^']+)'/g
    let match
    while ((match = pattern.exec(source)) !== null) {
      asked.push({ scenario: match[1], screen: match[2], file })
    }
  }

  return asked
}

function reportTodo() {
  const asked = scenariosAskedFor()
  const recorded = new Map()

  for (const { screen } of asked) {
    if (recorded.has(screen)) continue
    try {
      recorded.set(screen, JSON.parse(readFileSync(resolve(GOLDEN_DIR, `${screen}.json`), 'utf8')))
    } catch {
      recorded.set(screen, {})
    }
  }

  const missing = asked.filter(({ screen, scenario }) => !(scenario in recorded.get(screen)))

  if (!missing.length) {
    console.log(`all ${asked.length} scenario(s) recorded.`)
    return
  }

  console.log(`${missing.length} of ${asked.length} scenario(s) not yet recorded:\n`)
  let current = null
  for (const { screen, scenario } of missing) {
    if (screen !== current) {
      console.log(`  ${screen}`)
      current = screen
    }
    console.log(`    ${scenario}`)
  }
  console.log(`\nSee tests/unit/golden/README.md for how to capture one.`)
}

/* -------------------------------------------------------------- plumbing */

function parseArgs(argv) {
  const options = { todo: false, force: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--todo') options.todo = true
    else if (arg === '--force') options.force = true
    else if (arg === '--screen') options.screen = argv[++i]
    else if (arg === '--scenario') options.scenario = argv[++i]
    else if (arg === '--entries') options.entries = argv[++i]
    else if (arg.startsWith('--')) return usage(`unknown option ${arg}`)
    else options.har = arg
  }

  return options
}

function usage(message) {
  console.error(`${message}\n`)
  console.error(`  npm run golden -- <file.har>`)
  console.error(`  npm run golden -- <file.har> --screen <screen> --scenario "<scenario>" --entries 0`)
  console.error(`  npm run golden -- --todo`)
  process.exit(2)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

main(process.argv.slice(2))
