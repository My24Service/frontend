#!/usr/bin/env node
/**
 * ESLint over the codebase, one file at a time, with live progress.
 *
 * `eslint src` reports nothing until the whole run is done, and on a cold
 * cache the type-aware run takes long enough (tens of minutes) that silence
 * reads as a hang. This drives the same config through ESLint's Node API
 * file by file: a status line shows where it is, each problem is printed the
 * moment its file is done, and the usual stylish report follows at the end.
 * It shares `.eslintcache` with the plain `eslint --cache` command, so a
 * warm run still takes seconds.
 *
 * As a safety net for memory, eslint-plugin-typed-vue's caches are reset
 * when the heap fills up. (Its 0.2.0 release kept a TypeScript program per
 * linted `.vue` file and ran out of heap on `src`; the fork we install drops
 * them, so this should rarely fire.) A reset costs a rebuild of the plugin's
 * base program, about 12 seconds.
 *
 * Usage:
 *   npm run lint                          # all of src
 *   npm run lint -- src/features/order    # a subset (files or directories)
 *   npm run lint:fix                      # the same, with --fix
 *
 * Exits 1 when there are errors, like eslint.
 */
import { readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { getHeapStatistics } from 'node:v8'
import { ESLint } from 'eslint'

const ROOT = process.cwd()
const EXTENSIONS = /\.(?:[cm]?[jt]s|vue)$/
const HEAP_RESET_FRACTION = 0.7

const args = process.argv.slice(2)
const fix = args.includes('--fix')
const targets = args.filter((arg) => !arg.startsWith('--'))
if (targets.length === 0) targets.push('src')

// The plugin may be dropped from the config one day; the script should not care.
const resetPluginCache = await import('eslint-plugin-typed-vue')
  .then((plugin) => plugin.resetCache)
  .catch(() => () => {})

const eslint = new ESLint({ cache: true, fix })

/** A directory's own files first, then its subdirectories, so each directory's files run together. */
function walk(path, found) {
  if (!statSync(path).isDirectory()) {
    if (EXTENSIONS.test(path)) found.push(resolve(path))
    return found
  }
  const entries = readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of entries.filter((entry) => !entry.isDirectory())) walk(join(path, entry.name), found)
  for (const entry of entries.filter((entry) => entry.isDirectory())) walk(join(path, entry.name), found)
  return found
}

/** The files eslint would lint for these targets: not ignored, and matched by some config. */
async function lintableFiles() {
  const files = []
  for (const file of targets.flatMap((target) => walk(target, []))) {
    if (await eslint.isPathIgnored(file)) continue
    if ((await eslint.calculateConfigForFile(file)) === undefined) continue
    files.push(file)
  }
  return files
}

// ------------------------------------------------------------------ output

const tty = process.stdout.isTTY
const colour = (code) => (text) => (tty ? `\x1b[${code}m${text}\x1b[0m` : text)
const red = colour(31)
const yellow = colour(33)
const dim = colour(2)

const started = Date.now()
const elapsed = () => {
  const seconds = Math.round((Date.now() - started) / 1000)
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`
}

let statusShown = false
function clearStatus() {
  if (statusShown) process.stdout.write('\r\x1b[K')
  statusShown = false
}
function status(text) {
  if (!tty) return
  clearStatus()
  process.stdout.write(text.slice(0, process.stdout.columns - 1))
  statusShown = true
}
function print(line) {
  clearStatus()
  process.stdout.write(`${line}\n`)
}

const totals = { errors: 0, warnings: 0 }
const counts = () => {
  const errors = `${totals.errors} error${totals.errors === 1 ? '' : 's'}`
  const warnings = `${totals.warnings} warning${totals.warnings === 1 ? '' : 's'}`
  return `${totals.errors ? red(errors) : errors}, ${totals.warnings ? yellow(warnings) : warnings}`
}

function printProblems(result) {
  const path = relative(ROOT, result.filePath)
  for (const message of result.messages) {
    const severity = message.fatal || message.severity === 2 ? red('error') : yellow('warning')
    const rule = message.ruleId ? dim(`  ${message.ruleId}`) : ''
    print(`${path}:${message.line ?? 0}:${message.column ?? 0}  ${severity}  ${message.message}${rule}`)
  }
}

// -------------------------------------------------------------------- run

const files = await lintableFiles()
const results = []
const { heap_size_limit: heapLimit } = getHeapStatistics()
let resets = 0
let directory = null
let directoryStart = Date.now()

function finishDirectory(next) {
  if (directory !== null && !tty) {
    print(`${directory}  ${dim(`${Math.round((Date.now() - directoryStart) / 1000)}s`)}  (${elapsed()} so far: ${counts()})`)
  }
  directory = next
  directoryStart = Date.now()
}

print(`Linting ${files.length} files${fix ? ' with --fix' : ''}`)

for (const [index, file] of files.entries()) {
  const path = relative(ROOT, file)
  const folder = path.slice(0, path.lastIndexOf('/'))
  if (folder !== directory) finishDirectory(folder)

  const percent = String(Math.floor((index / files.length) * 100)).padStart(3)
  status(`[${index + 1}/${files.length}] ${percent}%  ${elapsed()}  ${counts()}  ${dim(path)}`)

  const [result] = await eslint.lintFiles([file])
  if (fix) await ESLint.outputFixes([result])
  results.push(result)

  totals.errors += result.errorCount
  totals.warnings += result.warningCount
  if (result.messages.length) printProblems(result)

  if (process.memoryUsage().heapUsed > heapLimit * HEAP_RESET_FRACTION) {
    resetPluginCache()
    resets++
  }
}
finishDirectory(null)
clearStatus()

const report = (await eslint.loadFormatter('stylish')).format(results.filter((result) => result.messages.length))
if (report) print(report)
print(`Linted ${files.length} files in ${elapsed()}: ${counts()}`)
if (resets) print(dim(`(reset eslint-plugin-typed-vue's caches ${resets}x to stay within the heap)`))

process.exitCode = totals.errors > 0 ? 1 : 0
