// Compare our hand-written validation copy with the official @valibot/i18n/nl
// messages. Run from the frontend root: node <this file> > out.md
import { readFileSync } from 'node:fs'
import * as v from 'valibot'
import '@valibot/i18n/nl'

v.setGlobalConfig({ lang: 'nl' })

// ---- Dutch translations from the Django catalogue -------------------------
const PO_FILES = [
  '../my24service/source/apps/core/locale/nl/LC_MESSAGES/django.po',
  '../my24service/source/apps/order/locale/nl/LC_MESSAGES/django.po',
]
const catalogue = new Map()
for (const file of PO_FILES) {
  const text = readFileSync(file, 'utf8')
  const re = /^msgid "((?:[^"\\]|\\.)*)"\nmsgstr "((?:[^"\\]|\\.)*)"/gm
  let m
  while ((m = re.exec(text))) {
    if (m[1] && m[2] && !catalogue.has(m[1])) catalogue.set(m[1], m[2])
  }
}
const nl = (en) => catalogue.get(en) ?? '⚠️ untranslated'

// ---- What valibot itself would say for each rule --------------------------
function official(schema, input) {
  const r = v.safeParse(schema, input)
  return r.success ? '(no issue)' : r.issues[0].message
}
const RULES = {
  required_text: {
    label: 'required text — `minLength(1)` on `""`',
    msg: official(v.pipe(v.string(), v.minLength(1)), ''),
  },
  required_pick: {
    label: 'required picker — `number()` given `null`',
    msg: official(v.number(), null),
  },
  max_length: {
    label: '`maxLength(255)` on 256 chars',
    msg: official(v.pipe(v.string(), v.maxLength(255)), 'x'.repeat(256)),
  },
  min_length: {
    label: '`minLength(2)` on 1 char',
    msg: official(v.pipe(v.string(), v.minLength(2)), 'a'),
  },
  email: { label: '`email()` on `"foo"`', msg: official(v.pipe(v.string(), v.email()), 'foo') },
  url: { label: '`url()` on `"foo"`', msg: official(v.pipe(v.string(), v.url()), 'foo') },
  regex: { label: '`regex(/^\\d+$/)` on `"abc"`', msg: official(v.pipe(v.string(), v.regex(/^\d+$/)), 'abc') },
  integer: { label: '`integer()` on `1.5`', msg: official(v.pipe(v.number(), v.integer()), 1.5) },
  nan: { label: '`number()` on `NaN` (typed text in a number field)', msg: official(v.number(), NaN) },
  min_value: { label: '`minValue(1)` on `0`', msg: official(v.pipe(v.number(), v.minValue(1)), 0) },
  check: { label: '`check()` failing', msg: official(v.pipe(v.string(), v.check(() => false)), 'x') },
  server: { label: 'server-side uniqueness (not a valibot rule)', msg: '— (no valibot equivalent)' },
}

// ---- Our messages, read off the source ------------------------------------
// Every validation-shaped `$trans('...')` literal under src/features, so the
// list cannot drift from the code. A line is grouped by the rule it answers
// through a few keyword heuristics; anything unrecognised lands in "other".
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (/\.(ts|vue)$/.test(name)) yield path
  }
}

const literals = []
for (const dir of ['src/features', 'src/services']) {
  for (const file of walk(dir)) {
    for (const match of readFileSync(file, 'utf8').matchAll(/\$trans\('([^']*)'\)/g)) literals.push(match[1])
  }
}
const relevant = literals
  .filter((text) => /^(Please |Passwords |You must |.* already in use$)/.test(text))
  .filter((text) => !/^Please (fix|contact)/.test(text))

const usage = new Map()
for (const text of relevant) usage.set(text, (usage.get(text) ?? 0) + 1)

function ruleOf(text) {
  if (/already in use/.test(text)) return 'server'
  if (/^Please select /.test(text)) return 'required_pick'
  if (/at most .* characters/.test(text)) return 'max_length'
  if (/at least .* characters/.test(text)) return 'min_length'
  if (/whole number$/.test(text)) return 'integer'
  if (/^Please enter a number$/.test(text)) return 'nan'
  if (/valid email/.test(text)) return 'email'
  if (/website/.test(text)) return 'url'
  if (/^Passwords|^You must/.test(text)) return 'check'
  if (/at (least|most) /.test(text)) return 'min_value'
  if (/^Please enter (a|the) %\(field\)s$|^Please tell us/.test(text)) return 'required_text'
  return 'regex'
}

const ORDER = Object.keys(RULES)
const OURS = [...usage.keys()]
  .map((text) => [ruleOf(text), text, `${usage.get(text)}× in src`])
  .sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]) || a[1].localeCompare(b[1]))

// ---- Output ---------------------------------------------------------------
const out = []
out.push('# Validation copy: ours vs. `@valibot/i18n/nl`\n')
out.push(`${OURS.length} validation msgids in src/features (76 before the rule templates in \`ruleMessage\` replaced the per-field copy), read off the source and grouped by the valibot rule that raises them. \`%(field)s\` is the field's label, \`%(n)s\` the rule's number.`)
out.push('The **official** line is the real output of `v.safeParse` with the nl locale loaded, on the sample input named in the heading.\n')

let lastRule = null
for (const [rule, en, where] of OURS) {
  if (rule !== lastRule) {
    const r = RULES[rule]
    out.push(`\n## ${r.label}\n`)
    out.push(`**Official nl:** \`${r.msg}\`\n`)
    out.push('| Ours (en) | Ours (nl, from django.po) | Used for |')
    out.push('|---|---|---|')
    lastRule = rule
  }
  out.push(`| ${en} | ${nl(en)} | ${where} |`)
}

// Untranslated summary
const missing = OURS.filter(([, en]) => !catalogue.has(en)).map(([, en]) => en)
out.push('\n## Not in the Dutch catalogue\n')
out.push(missing.length ? missing.map((m) => `- ${m}`).join('\n') : '(all translated)')

console.log(out.join('\n'))
