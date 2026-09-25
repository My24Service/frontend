/**
 * Rewrite the `@/api/**` imports in a source tree to the `Api` namespace.
 *
 * A screen should name the resource it is about and get everything the schema
 * says about it from that one name. This moves the call sites over; the
 * generator (scripts/generate-resources.mjs) is what makes the target shape
 * exist, and this is what points the existing code at it.
 *
 * How a name is decided, per import module:
 *
 * - `resources.gen` - the name is already the resource: `companyBranch` becomes
 *   `Api.CompanyBranch`. The helper types (`Resource`, `CollectionResource`, ...)
 *   are exported by the barrel too, so they move as well.
 * - `vue-query.gen` - each export is bound to one resource slot, so the map is
 *   read straight out of the generated file: `companyBranchListOptions` becomes
 *   `Api.CompanyBranch.list.options`. A name the generator does not bind is
 *   reported and left alone rather than guessed at.
 * - `types.gen` - `Api.<Type>`, except the model types a resource of the same
 *   name shadows; those are reported, because the resource is what `Api.<Name>`
 *   means now and the model is not reachable under it.
 * - `valibot.gen` - `schemas.<name>`, the alias the auto-import contract
 *   already declares for this module. These are runtime schemas (schema
 *   composition, `.options` on an enum), so a type cannot stand in for them.
 * - `sdk.gen` - reported and left alone. These are the loose endpoints and
 *   binary downloads that belong to no resource.
 *
 * Renaming goes through the symbol, not the text: a local of the same name in
 * an inner scope is not the import and must not be touched, which a regex
 * cannot tell apart.
 *
 * Idempotent - a second run finds no `@/api` import to rewrite and changes
 * nothing.
 *
 * Usage:
 *   node scripts/codemods/use-api-namespace.mjs [--dry] [dir ...]
 */

import {readFileSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {execSync} from 'node:child_process'
import {parse as parseSfc} from 'vue/compiler-sfc'
import {Project, SyntaxKind} from 'ts-morph'

const ROOT = resolve(import.meta.dirname, '../..')
const GENERATED = resolve(ROOT, 'src/api/resources.gen.ts')

const argv = process.argv.slice(2)
const dry = argv.includes('--dry')
const targets = argv.filter((a) => !a.startsWith('--'))
if (targets.length === 0) targets.push('src/features')

// --- the name map, read out of the generated file -------------------------
//
// Parsed, not pattern-matched: every `export const X = resource({...})` call's
// object literal is walked as an AST, so a change to how the generator lays
// the file out cannot silently empty the map.

/** `companyBranchListOptions` -> `Api.CompanyBranch.list.options` */
const bound = new Map()
/** Model types a resource of the same name shadows, which `Api.<Name>` is not. */
const shadowed = new Set()

const generatedFile = new Project({skipAddingFilesFromTsConfig: true}).addSourceFileAtPath(GENERATED)

/** `{options: X, queryKey: Y}` -> [['options', 'X'], ['queryKey', 'Y']] */
const slotsOf = (literal) =>
  literal
    .getProperties()
    .filter((p) => p.getKind() === SyntaxKind.PropertyAssignment)
    .map((p) => [p.getName(), p.getInitializer().getText()])

for (const statement of generatedFile.getVariableStatements()) {
  if (!statement.isExported()) continue
  for (const declaration of statement.getDeclarations()) {
    const call = declaration.getInitializerIfKind(SyntaxKind.CallExpression)
    if (call?.getExpression().getText() !== 'resource') continue
    const name = declaration.getName()
    const definition = call.getArguments()[0].asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    for (const property of definition.getProperties()) {
      if (property.getKind() !== SyntaxKind.PropertyAssignment) continue
      const key = property.getName()
      const value = property.getInitializer()
      if (['list', 'retrieve', 'create', 'update', 'replace', 'destroy'].includes(key)) {
        for (const [field, target] of slotsOf(value)) bound.set(target, `Api.${name}.${key}.${field}`)
      } else if (key === 'extras') {
        for (const extra of value.getProperties()) {
          for (const [field, target] of slotsOf(extra.getInitializer())) {
            bound.set(target, `Api.${name}.extras.${extra.getName()}.${field}`)
          }
        }
      }
    }
  }
}
if (bound.size === 0) throw new Error(`no resource({...}) bindings found in ${GENERATED}; has the generator's output changed?`)

const shadowedList = generatedFile.getVariableDeclarationOrThrow('shadowedModelTypes').getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
for (const element of shadowedList.getElements()) shadowed.add(element.getLiteralText())

// --- what one import specifier becomes ------------------------------------

/** The specifier names with no home. Per file, not global: an unmapped name in
 * one file must not keep an import alive in another that never mentions it. */
let unmappedHere = new Map()
/** The same, across every file, for the run summary at the end. */
const unmappedAll = new Map()
const note = (module, name) => {
  if (!unmappedHere.has(module)) unmappedHere.set(module, new Set())
  unmappedHere.get(module).add(name)
  if (!unmappedAll.has(module)) unmappedAll.set(module, new Set())
  unmappedAll.get(module).add(name)
}

/**
 * The `<script>` / `<script setup>` text of a file, with the offset it starts
 * at in the whole file, so the transform's text edits splice back correctly.
 */
function scriptBlocks(file, text) {
  if (!file.endsWith('.vue')) return [{text, start: 0}]
  const {descriptor} = parseSfc(text)
  return [descriptor.script, descriptor.scriptSetup]
    .filter(Boolean)
    .map((block) => ({text: text.slice(block.loc.start.offset, block.loc.end.offset), start: block.loc.start.offset}))
}

/** A name is a literal in the template scan, never a pattern. */
const escapeRe = (name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const inMemory = () => new Project({useInMemoryFileSystem: true, skipFileDependencyResolution: true})

function rewriteFile(file) {
  const absolute = resolve(ROOT, file)
  const whole = readFileSync(absolute, 'utf8')
  // Every name this file's script imported, and what it became. A `.vue`
  // template resolves those names through setup scope, so a template mention
  // has to move too - see the template pass below.
  const renames = new Map()
  let changed = false
  unmappedHere = new Map()

  for (const block of scriptBlocks(file, whole)) {
    const sf = inMemory().createSourceFile('block.ts', block.text)

    // Collect the edits first, then apply them back-to-front: applying one
    // shifts the positions of the rest.
    const edits = []
    let pending = false

    for (const declaration of sf.getImportDeclarations()) {
      const module = declaration.getModuleSpecifierValue()
      if (!module.startsWith('@/api')) continue
      // `import * as Api from '@/api'` already is the namespace.
      if (declaration.getDefaultImport()) continue

      const bindings = []
      for (const named of declaration.getNamedImports()) {
        const original = named.getName()
        const to = replacement(module, original)
        if (to === null) {
          // Left in place, so this declaration has to survive with it.
          note(module, original)
          continue
        }
        bindings.push({local: named.getAliasNode()?.getText() ?? original, original, to})
        // Recorded from the declaration, not from the uses found below: a name
        // the template uses and the script never does has no identifier to
        // find, and its template mention still has to move.
        renames.set(bindings.at(-1).local, to)
      }
      if (bindings.length === 0) continue
      pending = true

      for (const {local, original, to} of bindings) {
        // Every identifier that resolves to THIS import specifier - and only
        // those, so a shadowing local in an inner scope is left alone.
        for (const id of sf.getDescendantsOfKind(SyntaxKind.Identifier)) {
          if (id.getText() !== local) continue
          // The specifier's own name resolves to itself and is not a use: the
          // declaration is about to be deleted, and renaming it would leave
          // `import { Api.CompanyBranch } from '@/api/resources.gen'`.
          const parent = id.getParent()
          if (parent && (parent.getKind() === SyntaxKind.ImportSpecifier || parent.getKind() === SyntaxKind.ImportClause)) continue
          const declarations = id.getSymbol()?.getDeclarations() ?? []
          const isThisImport = declarations.some(
            (d) => d.getKind() === SyntaxKind.ImportSpecifier && d.getText().includes(original),
          )
          if (isThisImport) {
            edits.push({start: id.getStart(), end: id.getEnd(), text: to})
            renames.set(local, to)
          }
        }
      }
    }

    if (!pending) continue
    changed = true

    let out = block.text
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      out = out.slice(0, edit.start) + edit.text + out.slice(edit.end)
    }

    // Drop what the import no longer owes. The specifiers themselves are never
    // renamed (a declaration cannot hold `Api.X`), so this is a second pass
    // over the rewritten text. A declaration is rebuilt from the specifiers
    // that still have no other home - a name with no `Api` equivalent keeps
    // the declaration alive on its own, and the ones that moved go out of it.
    // Rebuilding rather than deleting is what makes a *partly* mapped
    // declaration correct: deleting it would take the surviving name with it.
    const sf2 = inMemory().createSourceFile('block.ts', out)
    const edits2 = []
    for (const d of sf2.getImportDeclarations()) {
      const module = d.getModuleSpecifierValue()
      if (!module.startsWith('@/api')) continue
      if (d.getDefaultImport()) continue
      const unmapped = unmappedHere.get(module)
      const kept = d.getNamedImports().filter((n) => unmapped?.has(n.getName()))
      if (kept.length === d.getNamedImports().length && d.getNamedImports().length > 0) continue
      const quote = d.getModuleSpecifier().getText().startsWith('"') ? '"' : "'"
      const typeOnly = d.isTypeOnly() ? 'type ' : ''
      // `import { type Foo, Bar }` - the inline `type` on a specifier is part
      // of its own text, so it is carried over verbatim.
      const text = kept.length === 0
        ? ''
        : `import ${typeOnly}{ ${kept.map((n) => n.getText()).join(', ')} } from ${quote}${module}${quote}`
      edits2.push({start: d.getStart(), end: d.getEnd(), text})
    }
    for (const e of edits2.sort((a, b) => b.start - a.start)) {
      out = out.slice(0, e.start) + e.text + out.slice(e.end)
    }
    // An emptied declaration leaves a blank line behind.
    out = out.replace(/\n{3,}/g, '\n\n')

    if (!dry) {
      writeFileSync(absolute, whole.slice(0, block.start) + out + whole.slice(block.start + block.text.length))
    }
  }

  // The template pass. A `<template>` sees the script's bindings through setup
  // scope, so `:destroyMutation="mobileTripDestroyMutation"` has to move too,
  // or the template loses a name the script no longer imports.
  //
  // It walks the template AST and rewrites only *expressions* - a directive
  // binding's or an interpolation's JavaScript - and does it through ts-morph,
  // so a string literal is never a candidate. A textual pass over the block
  // gets this wrong in a way that is invisible until a test asserts on copy:
  // `$trans('Invoice has been deleted')` sits inside a directive value, and
  // renaming the `Invoice` inside it yields 'Api.Invoice has been deleted'.
  if (!file.endsWith('.vue') || renames.size === 0) return changed
  // Re-read: the script pass above may have rewritten this file already, and
  // splicing into the pre-rewrite text would undo it.
  const current = readFileSync(absolute, 'utf8')
  const {descriptor} = parseSfc(current)
  if (!descriptor.template?.ast) return changed
  // `prop.exp` and interpolation offsets are relative to the WHOLE file, not
  // to the template block - they are sliced out of `current` below, not out of
  // a template-local copy. Getting this wrong lands the offsets inside string
  // literals, which is how `emit('linkMaterial', ...)` became
  // `emit('linkApi.Material', ...)`.
  //
  // Every JavaScript region in the template, as [start, end) into `current`.
  const expressions = []
  const visit = (node) => {
    for (const prop of node.props ?? []) {
      if (prop.type === 7 /* DIRECTIVE */ && prop.exp) {
        expressions.push([prop.exp.loc.start.offset, prop.exp.loc.end.offset])
      }
    }
    for (const child of node.children ?? []) {
      if (child.type === 5 /* INTERPOLATION */) {
        expressions.push([child.content.loc.start.offset, child.content.loc.end.offset])
      }
      if (child.children) visit(child)
    }
  }
  for (const child of descriptor.template.ast.children ?? []) visit(child)

  const edits = []
  for (const [from, to] of expressions) {
    const source = current.slice(from, to)
    const sf = inMemory().createSourceFile('expr.ts', source)
    for (const id of sf.getDescendantsOfKind(SyntaxKind.Identifier)) {
      const replacement = renames.get(id.getText())
      // A property name (`a.Api`), an object key, or a string's contents is
      // not the binding - only a bare reference to it is.
      if (!replacement) continue
      const parent = id.getParent()
      if (parent?.getKind() === SyntaxKind.PropertyAccessExpression && parent.getNameNode() === id) continue
      edits.push({start: from + id.getStart(), end: from + id.getEnd(), text: replacement})
    }
  }
  if (edits.length === 0) return changed
  let out = current
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end)
  }
  changed = true
  if (!dry) writeFileSync(absolute, out)
  return changed
}

// --- run ------------------------------------------------------------------

const files = execSync(
  `git ls-files -- ${targets.map((t) => `'${t}'`).join(' ')} | grep -E '\\.(ts|vue)$'`,
  {cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
)
  .trim()
  .split('\n')
  .filter(Boolean)

let touched = 0
for (const file of files) if (rewriteFile(file)) touched++

const unmapped = [...unmappedAll.entries()]
  .flatMap(([module, names]) => [...names].map((name) => ({module, name})))
  .sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name))

console.log(`${dry ? 'would rewrite' : 'rewrote'} ${touched} of ${files.length} file(s); ${bound.size} bound name(s) known`)
if (unmapped.length === 0) {
  console.log('every @/api import had a home in the Api namespace')
} else {
  console.log(`\n${unmapped.length} name(s) had no home and were left imported:`)
  for (const {module, name} of unmapped) console.log(`  ${module}  ${name}`)
}


/** Null means: leave it, and report it. */
function replacement(module, name) {
  if (module.endsWith('resources.gen')) return `Api.${name}`
  if (module.endsWith('vue-query.gen')) return bound.get(name) ?? null
  if (module.endsWith('types.gen')) return shadowed.has(name) ? null : `Api.${name}`
  if (module.endsWith('valibot.gen')) return `schemas.${name}`
  return null // sdk.gen: no resource owns it
}
