// Feeds the hand-written route tree into vue-router's route tree, so the
// plugin's generated route-map.d.ts types our route names and params without
// switching to file-based routing. Runtime routing never reads this tree.
import path from 'node:path'
import { runnerImport } from 'vite'

// Keep in step with the spreads in src/router/index.js.
const ROUTE_MODULES = [
  '/src/router/webshop.js',
  '/src/router/bim.js',
  '/src/router/orders.js',
  '/src/router/quotations.js',
  '/src/router/invoices.js',
  '/src/router/mobile.js',
  '/src/router/customer.js',
  '/src/router/equipment.js',
  '/src/router/inventory.js',
  '/src/router/company.js',
  '/src/router/member.js',
  '/src/router/account.js',
  '/src/router/budget.js',
  '/src/router/catchall.js',
  '/src/router/dashboard.js',
  '/src/router/settings.js',
]

// The SSR transform rewrites `() => import('@/x.vue')` to a call on the
// resolved id, so the loader's source names the file.
const LOADER_FILE = /__vite_ssr_dynamic_import__\(\s*["']([^"']+\.vue)["']/

function componentFile(component, root) {
  if (!component) return undefined
  if (typeof component === 'function') {
    const match = String(component).match(LOADER_FILE)
    return match && path.join(root, match[1])
  }
  return component.__file
}

// Route files import layouts eagerly, and a real SFC drags in the app, which
// touches `document` at load time. The tree only needs each file's path.
const stubComponents = {
  name: 'typed-routes:stub-components',
  enforce: 'pre',
  load(id) {
    if (id.endsWith('.vue')) return `export default { __file: ${JSON.stringify(id)} }`
  },
}

function joinPath(parent, child) {
  if (child.startsWith('/')) return child
  return [parent.replace(/\/$/, ''), child].filter(Boolean).join('/')
}

// File-based parsing has no custom regexps: `:pk(\\d+)` types as `:pk`.
const stripRegexps = (p) => p.replace(/(:\w+)\([^)]*\)/g, '$1')

function* namedRoutes(records, parentPath = '') {
  for (const record of records) {
    const fullPath = joinPath(parentPath, record.path)
    if (record.name) yield { record, fullPath }
    if (record.children) yield* namedRoutes(record.children, fullPath)
  }
}

export async function insertHandWrittenRoutes(root, projectRoot) {
  const problems = []

  // constants.ts and base-url.ts read document.location at load time.
  const hadDocument = 'document' in globalThis
  if (!hadDocument) globalThis.document = { location: new URL('http://localhost:3000') }
  try {
    await insertModules(root, projectRoot, problems)
  } finally {
    if (!hadDocument) delete globalThis.document
  }

  if (problems.length) {
    throw new Error(`Route table can't be typed:\n  ${problems.join('\n  ')}`)
  }
}

async function insertModules(root, projectRoot, problems) {
  const pathByName = new Map()
  const nameByPath = new Map()

  for (const id of ROUTE_MODULES) {
    const { module } = await runnerImport(id, {
      configFile: false,
      root: projectRoot,
      logLevel: 'warn',
      plugins: [stubComponents],
      resolve: {
        extensions: ['.ts', '.js', '.json', '.vue'],
        alias: { '@': path.join(projectRoot, 'src') },
      },
    })

    for (const { record, fullPath } of namedRoutes(module.default)) {
      const treePath = stripRegexps(fullPath)

      if (pathByName.has(record.name)) {
        problems.push(`duplicate name "${record.name}": ${pathByName.get(record.name)} and ${fullPath}`)
        continue
      }
      // The tree holds one node per path, so a second name would silently
      // replace the first. At runtime only the first route matches the URL.
      if (nameByPath.has(treePath)) {
        problems.push(`"${nameByPath.get(treePath)}" and "${record.name}" share the path ${fullPath}`)
        continue
      }
      pathByName.set(record.name, fullPath)
      nameByPath.set(treePath, record.name)

      const views = record.components ?? { default: record.component }
      const main = views['app-content'] ?? views.default ?? Object.values(views)[0]
      const file = componentFile(main, projectRoot) ?? `${id}#${record.name}`

      root.insert(treePath, file).name = record.name
    }
  }
}
