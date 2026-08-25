/**
 * The `module_paths_pks` encoding, in one place.
 *
 * A Contract is a name plus a set of Module Parts, and the parts travel to the
 * backend folded into one string: `"1:246|7:258,255"` — module id, colon,
 * comma-separated part ids, pipe between modules. The checkbox tree on the
 * Contract form is what a user reads that string as; these two functions are
 * the whole translation between them.
 *
 * Part ids are strings throughout: they arrive as strings from the encoding,
 * and the checkboxes bind `value` as a string, so nothing here ever compares a
 * coerced number against an uncoerced one — the class of bug that silently
 * drops entitlements.
 */

/** Per-module selected part ids, keyed by module id as a string. */
export type ModuleSelection = Record<string, string[]>

/**
 * Fold the selection into the wire encoding.
 *
 * Modules with nothing selected contribute nothing; module order follows the
 * selection object's own insertion order, which the form seeds from the
 * backend's module order so an untouched edit encodes back exactly as it came
 * in.
 */
export function pathsFromSelection(selection: ModuleSelection): string {
  const paths: string[] = []
  for (const [moduleId, parts] of Object.entries(selection)) {
    if (parts.length) {
      paths.push(`${moduleId}:${parts.join(',')}`)
    }
  }
  return paths.join('|')
}

/**
 * Parse the stored encoding into per-module selections of string ids.
 *
 * A nullish or empty encoding means no selection at all — the create form's
 * starting point.
 */
export function selectionFromPaths(paths: string | null | undefined): ModuleSelection {
  if (!paths) return {}

  const selection: ModuleSelection = {}
  for (const moduleElement of paths.split('|')) {
    const [moduleId = '', partList = ''] = moduleElement.split(':')
    if (!moduleId || !partList) continue
    selection[moduleId] = partList.split(',')
  }
  return selection
}
