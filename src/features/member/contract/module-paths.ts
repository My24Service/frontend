/** The checkbox tree's state: per module id, the ticked part ids. */
export type ModuleSelection = Record<string, string[]>

/** The wire rows for the ticked parts; modules with nothing ticked are left out. */
export function pathsFromSelection(selection: ModuleSelection): Api.ModulePath[] {
  return Object.entries(selection)
    .filter(([, parts]) => parts.length)
    .map(([moduleId, parts]) => ({module: Number(moduleId), parts: parts.map(Number)}))
}

/** The tree state a stored contract's rows select. */
export function selectionFromPaths(paths: Api.ModulePath[] | null | undefined): ModuleSelection {
  const selection: ModuleSelection = {}
  for (const path of paths ?? []) {
    if (path.parts.length) selection[`${path.module}`] = path.parts.map(String)
  }
  return selection
}
