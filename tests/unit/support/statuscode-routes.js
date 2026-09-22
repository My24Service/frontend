import { CODE_TYPES } from '@/features/statuscode'

/**
 * The routes the Statuscode-Slice screens link to, for the harness's router.
 *
 * Same purpose as `user-routes.js`: a deep mount renders the real
 * `<router-link>`s, each resolving its `:to` at setup time, and an unknown
 * name throws "No match for {name}". The names and paths mirror
 * `src/router/company.js` and the `/settings/statuscodes` tree in
 * `src/router/settings.js`, one set per code type, so a spec that follows a
 * link lands where the application would.
 */

const blank = { template: '<div />' }

function companyRoutes(type) {
  return [
    { path: `/company/statuscodes/${type}`, name: `company-statuscodes-${type}`, component: blank },
    { path: `/company/statuscodes/${type}/form`, name: `company-statuscodes-${type}-add`, component: blank },
    { path: `/company/statuscodes/${type}/form/:pk`, name: `company-statuscodes-${type}-edit`, component: blank },
    { path: `/company/statuscodes/action/${type}/add/:statuscode_pk`, name: `company-statuscodes-action-${type}-add`, component: blank },
    { path: `/company/statuscodes/action/${type}/form/:pk`, name: `company-statuscodes-action-${type}-edit`, component: blank },
  ]
}

function settingsRoutes(type) {
  return [
    { path: `/settings/statuscodes/${type}`, name: `settings-${type}-statuscode-list`, component: blank },
    { path: `/settings/statuscodes/${type}/form`, name: `settings-${type}-statuscode-add`, component: blank },
    { path: `/settings/statuscodes/${type}/form/:pk`, name: `settings-${type}-statuscode-edit`, component: blank },
    { path: `/settings/statuscodes/${type}/action/add/:statuscode_pk`, name: `settings-${type}-statuscode-action-add`, component: blank },
    { path: `/settings/statuscodes/${type}/action/form/:pk`, name: `settings-${type}-statuscode-action-edit`, component: blank },
  ]
}

export const statuscodeRoutes = [
  { path: '/company/statuscodes', name: 'company-statuscodes', component: blank },
  ...CODE_TYPES.flatMap((type) => [...companyRoutes(type), ...settingsRoutes(type)]),
]
