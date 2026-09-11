export type ModuleSelection = Record<string, string[]>

export function pathsFromSelection(selection: ModuleSelection): string {
  const paths: string[] = []
  for (const [moduleId, parts] of Object.entries(selection)) {
    if (parts.length) {
      paths.push(`${moduleId}:${parts.join(',')}`)
    }
  }
  return paths.join('|')
}

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
