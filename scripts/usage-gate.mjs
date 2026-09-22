/**
 * Usage gate: list contract operations that no client calls.
 *
 * The contract is `openapi/schema.yaml`. An operation counts as used when any
 * of these reference it:
 *
 *   1. the generated client - an `operationId` (or its `...Options`,
 *      `...Mutation`, `...QueryKey`, `...InfiniteOptions` wrapper from
 *      `src/api/@tanstack`) appears in `src/` outside `src/api`;
 *   2. a legacy service class under `src/models` (`class X extends BaseModel`
 *      with a `url` field) that is itself imported somewhere, via its base CRUD
 *      verbs or a custom method that builds a URL;
 *   3. a raw path literal such as `'/company/branch-my/'` anywhere else in
 *      `src/`;
 *   4. the Flutter apps in `my24-mobile` - `basePath` / `basePathAddition`
 *      fields and path literals in the hand-written services under `packages/`
 *      and `apps/`. Scanned live with `--mobile <path>`; otherwise read from
 *      the committed snapshot `scripts/usage-gate/mobile-callers.json`, since
 *      CI has no checkout of the mobile repo. Refresh the snapshot with
 *      `--mobile <path> --write-mobile-snapshot` whenever mobile call sites
 *      change.
 *
 * `scripts/usage-gate/allowlist.json` holds the exceptions:
 *   - `operations`: contract operations with no client caller by design
 *     (integrations, API-token users). Never flagged.
 *   - `uncontracted`: paths clients call that are not in the schema, such as
 *     Django's `GET /api/jsi18n/`. Reported as "called outside the contract"
 *     unless listed here.
 *
 * Verbs: web and Flutter never send PUT (see block A), so a caller that gives
 * no verb matches every verb except PUT. PUT operations are flagged unless a
 * caller names the verb explicitly.
 *
 * Exit code: 0 always, unless `--strict` is given and anything is flagged.
 * `--json` prints the result as JSON instead of text.
 *
 * Usage:
 *   node scripts/usage-gate.mjs
 *   node scripts/usage-gate.mjs --mobile ../my24-mobile
 *   node scripts/usage-gate.mjs --mobile ../my24-mobile --write-mobile-snapshot
 *   node scripts/usage-gate.mjs --strict
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SCHEMA = join(ROOT, 'openapi/schema.yaml')
const SRC = join(ROOT, 'src')
const ALLOWLIST = join(ROOT, 'scripts/usage-gate/allowlist.json')
const MOBILE_SNAPSHOT = join(ROOT, 'scripts/usage-gate/mobile-callers.json')

const METHODS = ['get', 'post', 'put', 'patch', 'delete']
const WRAPPER_SUFFIXES = ['', 'Options', 'Mutation', 'QueryKey', 'InfiniteOptions', 'InfiniteQueryKey']

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { mobile: null, writeMobileSnapshot: false, strict: false, json: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--mobile') args.mobile = resolve(argv[++i])
    else if (a === '--write-mobile-snapshot') args.writeMobileSnapshot = true
    else if (a === '--strict') args.strict = true
    else if (a === '--json') args.json = true
    else {
      console.error(`unknown argument: ${a}`)
      process.exit(2)
    }
  }
  return args
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

function walk(dir, { exts, skipDirs = [] }, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (!skipDirs.includes(name) && !skipDirs.includes(full)) walk(full, { exts, skipDirs }, out)
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(full)
    }
  }
  return out
}

function isWebTestFile(path) {
  return /\.(spec|test)\.[jt]sx?$/.test(path) || path.includes('/__tests__/') || path.includes('/__mocks__/')
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

/** @returns {Map<string, {verb: string, path: string, operationId: string}>} keyed by "VERB /api/path/" */
function loadContract() {
  const doc = parse(readFileSync(SCHEMA, 'utf8'))
  const ops = new Map()
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    for (const method of METHODS) {
      const op = item?.[method]
      if (!op) continue
      const verb = method.toUpperCase()
      ops.set(`${verb} ${path}`, { verb, path, operationId: camelCase(op.operationId) })
    }
  }
  return ops
}

/** `accounts_login_create` (schema) -> `accountsLoginCreate` (hey-api SDK). */
function camelCase(id) {
  return id ? id.replace(/_([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()) : id
}

// ---------------------------------------------------------------------------
// URL matching
// ---------------------------------------------------------------------------

/** Turn a caller's path into a comparable pattern: no `/api` prefix, no query, `{x}` for dynamic segments. */
function normalisePath(raw) {
  let p = raw.split('?')[0]
  p = p.replace(/\$\{[^}]*\}/g, '{id}') // JS template `${x}`
  p = p.replace(/\$[A-Za-z_][A-Za-z0-9_]*/g, '{id}') // Dart `$x`
  if (p.startsWith('/api/')) p = p.slice('/api'.length)
  if (!p.startsWith('/')) p = '/' + p
  return p
}

function segments(p) {
  return p.split('/').filter(Boolean)
}

/** Does a caller (verb or ANY, pattern) hit a contract operation? */
function matches(callerVerb, callerPath, op) {
  if (callerVerb === 'ANY' && op.verb === 'PUT') return false
  if (callerVerb !== 'ANY' && callerVerb !== op.verb) return false
  const cs = segments(callerPath)
  const os = segments(op.path.startsWith('/api/') ? op.path.slice('/api'.length) : op.path)
  if (cs.length !== os.length) return false
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i]
    const o = os[i]
    const cDyn = c.startsWith('{') && c.endsWith('}')
    const oDyn = o.startsWith('{') && o.endsWith('}')
    if (cDyn || oDyn) continue
    if (c !== o) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Web: generated client
// ---------------------------------------------------------------------------

function webSourceFiles() {
  return walk(SRC, { exts: ['.ts', '.js', '.vue'], skipDirs: [join(SRC, 'api')] }).filter((f) => !isWebTestFile(f))
}

/** Every identifier-looking token in the web sources, so operationId lookups are O(1). */
function collectIdentifiers(files) {
  const ids = new Set()
  for (const f of files) {
    const text = readFileSync(f, 'utf8')
    for (const m of text.matchAll(/\b[A-Za-z_$][A-Za-z0-9_$]*\b/g)) ids.add(m[0])
  }
  return ids
}

function scanGeneratedClient(ops, identifiers) {
  const used = new Map() // opKey -> ['sdk:<name>']
  for (const [key, op] of ops) {
    if (!op.operationId) continue
    const hits = WRAPPER_SUFFIXES.map((s) => op.operationId + s).filter((n) => identifiers.has(n))
    if (hits.length) used.set(key, hits.map((h) => `sdk:${h}`))
  }
  return used
}

// ---------------------------------------------------------------------------
// Web: legacy service classes under src/models
// ---------------------------------------------------------------------------

const CLASS_RE = /class\s+(\w+)\s+extends\s+(\w+)/g
const URL_FIELD_RE = /^\s*url\s*=\s*['"]([^'"]+)['"]/m
const METHOD_RE = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm
const TEMPLATE_URL_RE = /`\$\{this\.url\}([^`]*)`/g
const CONCAT_URL_RE = /this\.url\s*\+\s*['"]([^'"]*)['"]/g
const LITERAL_URL_RE = /['"`](\/[a-zA-Z0-9_\-/{}$]*?\/)(?:\?[^'"`]*)?['"`]/g
const VERB_HINTS = [
  [/\.post\(/, 'POST'],
  [/\.patch\(/, 'PATCH'],
  [/\.put\(/, 'PUT'],
  [/\.delete\(/, 'DELETE'],
  [/\.get\(/, 'GET'],
]

function braceBlock(text, openIdx) {
  let depth = 0
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return text.slice(openIdx, i)
  }
  return text.slice(openIdx)
}

function verbOf(body) {
  for (const [re, v] of VERB_HINTS) if (re.test(body)) return v
  return 'ANY'
}

function parseLegacyServices() {
  const files = walk(join(SRC, 'models'), { exts: ['.ts', '.js'] }).filter((f) => !isWebTestFile(f))
  const services = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(CLASS_RE)) {
      const body = braceBlock(text, m.index + m[0].length + text.slice(m.index + m[0].length).indexOf('{'))
      const url = URL_FIELD_RE.exec(body)?.[1] ?? null
      const methods = {}
      for (const mm of body.matchAll(METHOD_RE)) {
        const name = mm[1]
        if (['constructor', 'if', 'for', 'while', 'switch', 'catch'].includes(name)) continue
        const mbody = braceBlock(body, mm.index + mm[0].length - 1)
        const frags = new Set()
        for (const t of mbody.matchAll(TEMPLATE_URL_RE)) frags.add(t[1])
        for (const c of mbody.matchAll(CONCAT_URL_RE)) frags.add(c[1])
        for (const l of mbody.matchAll(LITERAL_URL_RE)) frags.add(l[1])
        if (!frags.size) continue
        const urls = new Set()
        for (const frag of frags) {
          if (frag.startsWith('/')) urls.add(frag)
          else if (url) urls.add(`${url.replace(/\/$/, '')}/${frag.replace(/^\//, '')}`)
        }
        methods[name] = { verb: verbOf(mbody), urls: [...urls] }
      }
      services.push({ cls: m[1], parent: m[2], file, url, methods })
    }
  }
  // Keep only service classes (transitively extending BaseModel); inherit
  // the parent's `url` and URL-building methods.
  const byName = new Map(services.map((s) => [s.cls, s]))
  const resolved = new Map()
  const isService = (s) => {
    if (s.parent === 'BaseModel') return true
    const p = byName.get(s.parent)
    return p ? isService(p) : false
  }
  const merge = (s) => {
    if (resolved.has(s.cls)) return resolved.get(s.cls)
    const p = byName.get(s.parent)
    const base = p && isService(p) ? merge(p) : { url: null, methods: {} }
    const out = { ...s, url: s.url ?? base.url, methods: { ...base.methods, ...s.methods } }
    resolved.set(s.cls, out)
    return out
  }
  return services.filter(isService).map(merge)
}

/**
 * Files that reference a service: by importing its module path, or by class
 * name when that name is unique across src/models (several models share
 * names such as `CostService`, so a bare name match would credit the wrong one).
 */
function usersOf(service, webFiles, nameCounts) {
  const modulePath = relative(SRC, service.file).replace(/\.(ts|js)$/, '')
  const nameRe = nameCounts.get(service.cls) === 1 ? new RegExp(`\\b${service.cls}\\b`) : null
  const importRe = new RegExp(`['"][^'"]*${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\.js|\\.ts)?['"]`)
  const out = []
  for (const f of webFiles) {
    if (f.startsWith(join(SRC, 'models'))) continue
    const text = readFileSync(f, 'utf8')
    if (importRe.test(text) || (nameRe && nameRe.test(text))) out.push({ file: f, text })
  }
  return out
}

function scanLegacyServices(ops, webFiles) {
  const used = new Map()
  const add = (key, via) => used.set(key, [...(used.get(key) ?? []), via])
  const services = parseLegacyServices()
  const report = { total: services.length, unused: [] }
  const nameCounts = new Map()
  for (const s of services) nameCounts.set(s.cls, (nameCounts.get(s.cls) ?? 0) + 1)

  for (const svc of services) {
    const users = usersOf(svc, webFiles, nameCounts)
    if (!users.length) {
      report.unused.push(svc.cls)
      continue
    }
    const calls = [] // [verb, path, via]
    if (svc.url) {
      const base = svc.url
      const detail = `${base.replace(/\/$/, '')}/{id}/`
      const verbs = new Set()
      for (const { text } of users) {
        if (/\.list\(/.test(text)) verbs.add('LIST')
        if (/\.detail\(/.test(text)) verbs.add('DETAIL')
        if (/\.insert\(/.test(text)) verbs.add('POST')
        if (/\.update\(/.test(text)) verbs.add('PATCH')
        if (/\.delete\(/.test(text)) verbs.add('DELETE')
      }
      if (verbs.has('LIST')) calls.push(['GET', base, `${svc.cls}.list`])
      if (verbs.has('DETAIL')) calls.push(['GET', detail, `${svc.cls}.detail`])
      if (verbs.has('POST')) calls.push(['POST', base, `${svc.cls}.insert`])
      if (verbs.has('PATCH')) calls.push(['PATCH', detail, `${svc.cls}.update`])
      if (verbs.has('DELETE')) calls.push(['DELETE', detail, `${svc.cls}.delete`])
      if (!verbs.size) {
        calls.push(['ANY', base, `${svc.cls}.base`])
        calls.push(['ANY', detail, `${svc.cls}.base`])
      }
    }
    for (const [name, info] of Object.entries(svc.methods)) {
      const called = users.some(({ text }) => new RegExp(`\\.${name}\\(`).test(text))
      if (!called) continue
      for (const u of info.urls) calls.push([info.verb, u, `${svc.cls}.${name}`])
    }
    for (const [verb, path, via] of calls) {
      const p = normalisePath(path)
      for (const [key, op] of ops) if (matches(verb, p, op)) add(key, via)
    }
  }
  return { used, report }
}

// ---------------------------------------------------------------------------
// Web: raw path literals outside src/api and src/models
// ---------------------------------------------------------------------------

function scanRawLiterals(ops, webFiles) {
  const used = new Map()
  const outside = new Map() // normalised path -> files
  for (const f of webFiles) {
    if (f.startsWith(join(SRC, 'models'))) continue
    const text = readFileSync(f, 'utf8')
    const lines = text.split('\n')
    for (const line of lines) {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue // comments
      for (const m of line.matchAll(LITERAL_URL_RE)) {
        const p = normalisePath(m[1])
        if (segments(p).length < 1) continue
        const verb = verbOf(line)
        let hit = false
        for (const [key, op] of ops) {
          if (matches(verb, p, op)) {
            used.set(key, [...(used.get(key) ?? []), `raw:${relative(ROOT, f)}`])
            hit = true
          }
        }
        if (!hit && m[1].startsWith('/api/')) {
          const k = `${verb} ${m[1].split('?')[0]}`
          outside.set(k, [...(outside.get(k) ?? []), relative(ROOT, f)])
        }
      }
    }
  }
  return { used, outside }
}

// ---------------------------------------------------------------------------
// Flutter: my24-mobile
// ---------------------------------------------------------------------------

// `final String basePath = "/x"`, `get basePath => "/x"`, `get basePath { return "/x"; }`
const DART_BASEPATH_RE = /basePath\s*(?:=|=>|\{\s*return)\s*['"]([^'"]+)['"]/g
// field, local, or named argument: `basePathAddition = 'x/'`, `basePathAddition: 'x/'`
const DART_ADDITION_RE = /basePathAddition\s*[:=]\s*['"]([^'"]+)['"]/g
const DART_BASEPATH_FRAG_RE = /\$basePath\/([^'"]*)/g
const DART_LITERAL_RE = /['"](\/[a-z][a-zA-Z0-9_\-/$]*)[^'"]*['"]/g

/** @returns {{bases: string[], additions: string[], frags: string[], literals: string[]}} */
function scanMobile(mobileRoot) {
  const roots = ['packages', 'apps'].map((d) => join(mobileRoot, d)).filter(existsSync)
  if (!roots.length) throw new Error(`no packages/ or apps/ under ${mobileRoot}`)
  const files = roots.flatMap((r) => walk(r, { exts: ['.dart'], skipDirs: ['test', 'integration_test', 'build', '.dart_tool'] }))
  const bases = new Set()
  const additions = new Set()
  const frags = new Set()
  const literals = new Set()
  for (const f of files) {
    const text = readFileSync(f, 'utf8')
    for (const m of text.matchAll(DART_BASEPATH_RE)) bases.add(m[1])
    for (const m of text.matchAll(DART_ADDITION_RE)) additions.add(m[1])
    for (const m of text.matchAll(DART_BASEPATH_FRAG_RE)) frags.add(m[1])
    for (const m of text.matchAll(DART_LITERAL_RE)) literals.add(m[1])
  }
  const sorted = (set) => [...set].sort()
  return { bases: sorted(bases), additions: sorted(additions), frags: sorted(frags), literals: sorted(literals) }
}

/**
 * Expand the scanned pieces into normalised caller paths (verb is always ANY).
 * A `basePathAddition` is often passed from a bloc to a service in another
 * file, so additions and fragments are combined with every base path. Only
 * combinations that exist in the contract can match, so this over-approximates
 * safely (an unused op is credited only when a suffix is shared between
 * resources).
 */
function expandMobile({ bases, additions, frags, literals }) {
  const paths = new Set(literals.map(normalisePath))
  for (const base of bases) {
    paths.add(normalisePath(`${base}/`))
    paths.add(normalisePath(`${base}/{id}/`))
    for (const a of additions) {
      paths.add(normalisePath(`${base}/${a}`))
      if (!a.startsWith('$')) paths.add(normalisePath(`${base}/{id}/${a}`)) // detail(pk, basePathAddition:)
    }
    for (const frag of frags) paths.add(normalisePath(`${base}/${frag}`))
  }
  return [...paths].map((p) => (p.endsWith('/') ? p : p + '/')).sort()
}

function loadMobilePaths(args) {
  if (args.mobile) {
    const scan = scanMobile(args.mobile)
    if (args.writeMobileSnapshot) {
      writeFileSync(
        MOBILE_SNAPSHOT,
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), ...scan }, null, 2) + '\n',
      )
    }
    return { paths: expandMobile(scan), source: `live scan of ${args.mobile}` }
  }
  if (!existsSync(MOBILE_SNAPSHOT)) throw new Error(`no --mobile path and no snapshot at ${MOBILE_SNAPSHOT}`)
  const snap = JSON.parse(readFileSync(MOBILE_SNAPSHOT, 'utf8'))
  return { paths: expandMobile(snap), source: `snapshot ${relative(ROOT, MOBILE_SNAPSHOT)} (${snap.generatedAt})` }
}

function matchMobile(ops, paths) {
  const used = new Map()
  for (const p of paths) {
    for (const [key, op] of ops) if (matches('ANY', p, op)) used.set(key, [...(used.get(key) ?? []), `flutter:${p}`])
  }
  return used
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2))
  const ops = loadContract()
  const allow = JSON.parse(readFileSync(ALLOWLIST, 'utf8'))
  const allowedOps = new Map(allow.operations.map((e) => [e.op, e.reason]))
  const allowedUncontracted = new Map(allow.uncontracted.map((e) => [e.path, e.reason]))

  const webFiles = webSourceFiles()
  const identifiers = collectIdentifiers(webFiles)
  const sdkUsed = scanGeneratedClient(ops, identifiers)
  const { used: legacyUsed, report: legacyReport } = scanLegacyServices(ops, webFiles)
  const { used: rawUsed, outside } = scanRawLiterals(ops, webFiles)
  const mobile = loadMobilePaths(args)
  const mobileUsed = matchMobile(ops, mobile.paths)

  const callers = new Map()
  for (const m of [sdkUsed, legacyUsed, rawUsed, mobileUsed]) {
    for (const [k, v] of m) callers.set(k, [...new Set([...(callers.get(k) ?? []), ...v])])
  }

  const flagged = []
  const staleAllow = []
  for (const key of ops.keys()) {
    const has = callers.has(key)
    if (allowedOps.has(key)) {
      if (has) staleAllow.push(key)
      continue
    }
    if (!has) flagged.push(key)
  }
  const unknownAllow = [...allowedOps.keys()].filter((k) => !ops.has(k))
  const uncontracted = [...outside.entries()].filter(([k]) => !allowedUncontracted.has(k))

  const result = {
    operations: ops.size,
    used: callers.size,
    allowlisted: allowedOps.size,
    flagged,
    uncontracted: Object.fromEntries(uncontracted),
    staleAllowlist: staleAllow,
    unknownAllowlist: unknownAllow,
    legacyServices: legacyReport,
    mobileSource: mobile.source,
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`usage-gate: ${ops.size} operations, ${callers.size} with a caller, ${allowedOps.size} allowlisted`)
    console.log(`  web: generated client + ${legacyReport.total} legacy services (${legacyReport.unused.length} unused)`)
    console.log(`  flutter: ${mobile.paths.length} caller paths from ${mobile.source}`)
    if (flagged.length) {
      console.log(`\n${flagged.length} operation(s) with no caller in web or Flutter:`)
      for (const k of flagged) console.log(`  ${k}`)
    } else {
      console.log('\nno unused operations')
    }
    if (uncontracted.length) {
      console.log(`\n${uncontracted.length} path(s) called outside the contract:`)
      for (const [k, files] of uncontracted) console.log(`  ${k}  (${files.join(', ')})`)
    }
    if (staleAllow.length) {
      console.log(`\n${staleAllow.length} allowlisted operation(s) now have a caller; drop them from the allowlist:`)
      for (const k of staleAllow) console.log(`  ${k}`)
    }
    if (unknownAllow.length) {
      console.log(`\n${unknownAllow.length} allowlisted operation(s) are not in the contract:`)
      for (const k of unknownAllow) console.log(`  ${k}`)
    }
    if (legacyReport.unused.length) {
      console.log(`\nlegacy services never imported: ${legacyReport.unused.join(', ')}`)
    }
  }

  const problems = flagged.length + uncontracted.length + staleAllow.length + unknownAllow.length
  if (args.strict && problems > 0) process.exit(1)
}

main()
