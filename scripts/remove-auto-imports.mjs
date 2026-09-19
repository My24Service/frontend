#!/usr/bin/env node
// Removes every import that the generated declaration files say is
// auto-provided, then verifies that claim. Idempotent: run it again and it
// reports zero changes.
//
// Usage: `npm run cleanup-imports` from the repo root.
//
// Contract sources (parsed, not hardcoded):
// - auto-imports.d.ts: `const X: typeof import('P')` = value X from package P
//   is auto-imported; `export type {...} from 'P'` = those types are global.
// - components.d.ts: GlobalComponents / GlobalDirectives = names the
//   Components plugin resolves in templates.
//
// Rules per file under src/ (skips generated src/api and *.d.ts):
// - value specifier X from P: dropped iff the contract maps X -> P.
// - type specifier (`type X`, or X inside `import type {...}`): dropped iff
//   the contract maps type X -> P.
// - `X as Y` aliases: kept (the global name differs from local use) + reported.
// - component/directive names (B*, IBi*, RouterLink/View, vBModal): dropped
//   iff template-only, i.e. absent from <script> AND from template
//   *expressions* (`:is="BFormInput"` needs a real binding; only pure tag
//   usage like <BButton> is auto-resolved).
// - `useToast` and friends need no special case: they are in the contract
//   as values from their packages.
// - @/components/*.vue and relative imports: left alone (tests stub them
//   by component name, which only works with explicit local imports).
//
// After running, verify with `npm run typecheck` and `npm test`.
import fs from 'node:fs'
import path from 'node:path'

const REPO = process.cwd()

// ---- contract ----
function parseContract() {
  const auto = fs.readFileSync(path.join(REPO, 'auto-imports.d.ts'), 'utf8')
  const values = new Map() // name -> package
  for (const m of auto.matchAll(/const (\w+): typeof import\('([^']+)'\)/g)) {
    values.set(m[1], m[2])
  }
  const types = new Map() // name -> package
  for (const m of auto.matchAll(/export type \{([^}]*)\} from '([^']+)'/g)) {
    for (const n of m[1].split(',').map(s => s.trim()).filter(Boolean)) {
      types.set(n, m[2])
    }
  }
  const comp = fs.readFileSync(path.join(REPO, 'components.d.ts'), 'utf8')
  const components = new Set()
  const compBlock = comp.slice(comp.indexOf('GlobalComponents'))
  for (const m of compBlock.matchAll(/(\w+): typeof import/g)) components.add(m[1])
  const directives = new Set()
  const dirIdx = comp.indexOf('GlobalDirectives')
  if (dirIdx > 0) {
    for (const m of comp.slice(dirIdx).matchAll(/(\w+): typeof import/g)) directives.add(m[1])
  }
  return { values, types, components, directives }
}
const { values, types, components, directives } = parseContract()
console.log(`contract: ${values.size} values, ${types.size} types, ${components.size} components, ${directives.size} directives`)

// vue-router registers these globally at runtime AND in its own
// GlobalComponents augmentation; the Components plugin no longer emits them.
const ROUTER_COMP = new Set(['RouterLink', 'RouterView'])
for (const n of ROUTER_COMP) components.add(n)

// ---- walk ----
function* walk(dir, rel = 'src') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    const r = path.join(rel, e.name)
    if (e.isDirectory()) {
      if (r === 'src/api') continue
      yield* walk(p, r)
    } else if (/\.(vue|ts|js)$/.test(e.name) && !e.name.endsWith('.d.ts')) {
      yield p
    }
  }
}

function scriptBodyWithoutImports(fileSrc, isVue) {
  const strip = (s) => s.replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*;?/gm, '\n')
  if (!isVue) return strip(fileSrc)
  const parts = []
  for (const m of fileSrc.matchAll(/<script[\s\S]*?<\/script\s*>/gi)) {
    parts.push(strip(m[0].replace(/^<script[^>]*>/i, '').replace(/<\/script\s*>$/i, '')))
  }
  return parts.join('\n')
}

function templateExpressions(fileSrc) {
  const tpls = fileSrc.match(/<template[\s\S]*?<\/template\s*>/gi) || []
  return tpls.join(' ').replace(/<\/?[A-Za-z][\w-]*/g, ' ')
}

const word = (body, name) => new RegExp(`\\b${name}\\b`).test(body)

// ---- transform ----
let changed = 0
const aliases = []
const report = []

for (const file of walk(path.join(REPO, 'src'))) {
  const src = fs.readFileSync(file, 'utf8')
  const isVue = file.endsWith('.vue')
  const scriptBody = scriptBodyWithoutImports(src, isVue)
  const tplExpr = isVue ? templateExpressions(src) : ''
  const templateOnly = (local) => !word(scriptBody, local) && !word(tplExpr, local)

  let out = src
  const notes = []
  for (const m of [...src.matchAll(/^import(\s+type)?\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm)]) {
    const [stmt, typeMod, list, source] = m
    const specs = list.split(',').map(s => s.trim()).filter(Boolean)
    const keep = []
    for (const raw of specs) {
      const aliasM = raw.match(/^(\w+)\s+as\s+(\w+)$/)
      if (aliasM) {
        keep.push(raw)
        aliases.push(`${path.relative(REPO, file)}: ${raw} from '${source}'`)
        continue
      }
      const typeM = raw.match(/^type\s+(\w+)$/)
      const name = typeM ? typeM[1] : raw
      const isType = Boolean(typeM) || Boolean(typeMod)
      if (isType) {
        if (types.get(name) === source) continue // globally typed -> drop
        keep.push(raw); continue
      }
      // value specifier
      if (values.get(name) === source) continue // auto-imported -> drop
      if (components.has(name) || directives.has(name)) {
        if (templateOnly(name)) continue // pure template tag usage -> drop
        keep.push(raw); continue
      }
      keep.push(raw)
    }
    if (keep.length === specs.length) continue
    if (keep.length === 0) {
      out = out.replace(stmt, '')
      notes.push(`- ${stmt.trim().slice(0, 110)}`)
    } else {
      out = out.replace(stmt, stmt.replace(list, ` ${keep.join(', ')} `))
      notes.push(`~ ${stmt.trim().slice(0, 90)}`)
    }
  }
  // default imports: only ~icons/* component defaults are covered
  for (const m of [...src.matchAll(/^import\s+(\w+)\s+from\s*['"](~icons[^'"]*)['"]\s*;?/gm)]) {
    const [stmt, local] = m
    if ((components.has(local) || /^IBi[A-Z]/.test(local)) && templateOnly(local)) {
      out = out.replace(stmt, '')
      notes.push(`- ${stmt.trim().slice(0, 110)}`)
    }
  }
  if (notes.length) {
    out = out.replace(/\n{3,}/g, '\n\n')
    fs.writeFileSync(file, out)
    changed++
    report.push(`${path.relative(REPO, file)}:\n  ${notes.join('\n  ')}`)
  }
}
console.log(`changed ${changed} files`)
console.log(report.join('\n'))

// ---- verify: re-scan with the same contract; anything still covered is a bug ----
const remaining = []
for (const file of walk(path.join(REPO, 'src'))) {
  const src = fs.readFileSync(file, 'utf8')
  const isVue = file.endsWith('.vue')
  const rel = path.relative(REPO, file)
  const scriptBody = scriptBodyWithoutImports(src, isVue)
  const tplExpr = isVue ? templateExpressions(src) : ''
  const templateOnly = (local) => !word(scriptBody, local) && !word(tplExpr, local)
  for (const m of [...src.matchAll(/^import(\s+type)?\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm)]) {
    const [, typeMod, list, source] = m
    for (const raw of list.split(',').map(s => s.trim()).filter(Boolean)) {
      if (/\bas\b/.test(raw)) continue // aliases: kept by design
      const typeM = raw.match(/^type\s+(\w+)$/)
      const name = typeM ? typeM[1] : raw
      if (typeM || typeMod) {
        if (types.get(name) === source) remaining.push(`${rel}: type ${name} from '${source}'`)
      } else if (values.get(name) === source) {
        remaining.push(`${rel}: ${name} from '${source}'`)
      } else if ((components.has(name) || directives.has(name)) && templateOnly(name)) {
        remaining.push(`${rel}: template-only component ${name} from '${source}'`)
      }
    }
  }
  for (const m of [...src.matchAll(/^import\s+(\w+)\s+from\s*['"](~icons[^'"]*)['"]/gm)]) {
    const [, local] = m
    if ((components.has(local) || /^IBi[A-Z]/.test(local)) && templateOnly(local)) {
      remaining.push(`${rel}: template-only icon ${local}`)
    }
  }
}
console.log('---')
if (remaining.length) {
  console.log(`VERIFY FAILED: ${remaining.length} covered imports remain:`)
  console.log(remaining.join('\n'))
  process.exitCode = 1
} else {
  console.log('VERIFY OK: zero covered imports remain in src/ (outside generated src/api)')
}
if (aliases.length) {
  console.log(`note: ${aliases.length} aliased specifiers kept by design:`)
  console.log(aliases.join('\n'))
}
