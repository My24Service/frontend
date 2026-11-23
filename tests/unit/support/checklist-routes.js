/**
 * The routes the checklist screens link to, for the harness's router. The
 * paths mirror `src/router/settings.js`. See member-routes.js for why a deep
 * mount needs them.
 */

const blank = { template: '<div />' }

export const checklistRoutes = [
  { path: '/settings/checklists', name: 'settings-checklists', component: blank },
  { path: '/settings/checklists/form', name: 'settings-checklist-add', component: blank },
  { path: '/settings/checklists/form/:pk', name: 'settings-checklist-edit', component: blank },
]
