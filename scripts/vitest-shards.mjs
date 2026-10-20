#!/usr/bin/env node
/**
 * Run the given spec files in sequential vitest shards, and write one JUnit
 * report for the lot.
 *
 * The whole suite in one vitest process runs a CircleCI medium container out
 * of memory: the `shared` project reuses one module graph per worker, and that
 * graph only grows over a run. Splitting the files over a few processes run
 * one after the other keeps the peak down.
 *
 * `circleci testsuite run` hands the run command the selected spec files and
 * reads a single JUnit file back, so the shards cannot each write their own.
 * This script runs them one by one into a scratch directory and merges the
 * reports' <testsuite> elements into the file testsuite asked for.
 *
 * It shards *within* one container, so it composes with CircleCI
 * `parallelism`: testsuite splits the files over the nodes first, and each
 * node shards its share again.
 *
 * Usage:
 *   node scripts/vitest-shards.mjs <junit-output> <spec files...>
 *
 * VITEST_SHARDS sets the number of shards (default 4).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const [output, ...files] = process.argv.slice(2)
if (!output) {
  console.error('Usage: node scripts/vitest-shards.mjs <junit-output> <spec files...>')
  process.exit(2)
}

// Nothing selected is a pass, not vitest's "No test files found" failure.
if (files.length === 0) {
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, '<?xml version="1.0" encoding="UTF-8" ?>\n<testsuites name="vitest tests"></testsuites>\n')
  process.exit(0)
}

// A shard with no files fails the same way, so never ask for more shards than
// there are files.
const shards = Math.max(1, Math.min(Number(process.env.VITEST_SHARDS) || 4, files.length))
const scratch = mkdtempSync(join(tmpdir(), 'vitest-shards-'))

let status = 0
const suites = []
for (let index = 1; index <= shards; index++) {
  const report = join(scratch, `shard-${index}.xml`)
  console.log(`\n=== vitest shard ${index}/${shards} ===`)
  const run = spawnSync(
    'pnpm',
    [
      'exec',
      'vitest',
      'run',
      '--reporter=default',
      '--reporter=junit',
      `--outputFile.junit=${report}`,
      `--shard=${index}/${shards}`,
      ...files,
    ],
    { stdio: 'inherit' },
  )
  // Keep going after a failing shard: the report should cover every file.
  if (run.status !== 0) status = run.status ?? 1

  if (!existsSync(report)) {
    console.error(`Shard ${index}/${shards} wrote no JUnit report.`)
    status = status || 1
    continue
  }
  suites.push(...(readFileSync(report, 'utf8').match(/<testsuite[\s>][\s\S]*?<\/testsuite>/g) ?? []))
}

mkdirSync(dirname(output), { recursive: true })
writeFileSync(
  output,
  `<?xml version="1.0" encoding="UTF-8" ?>\n<testsuites name="vitest tests">\n${suites.join('\n')}\n</testsuites>\n`,
)
rmSync(scratch, { recursive: true, force: true })
process.exit(status)
