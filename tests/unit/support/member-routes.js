/**
 * The routes the Member-Slice screens link to, for the harness's router.
 *
 * A deep mount renders the real `<router-link>`s in the list toolbars and row
 * icons, and each resolves its `:to` at setup time — an unknown name throws
 * "No match for {name}" and the mount dies. `shallowMount` never noticed
 * because it stubbed them away, which is one more thing a DOM-driven spec pays
 * for and gets something back from: a link pointing at a route that does not
 * exist is a broken link, and here it fails.
 *
 * Kept beside the specs rather than inside `form-harness.js` so the harness
 * does not accumulate every screen's route names; pass it as `routes`.
 *
 * The paths mirror `src/router/member.js`, so a spec that navigates rather
 * than remounting lands where the application would.
 */

const blank = { template: '<div />' }

export const memberRoutes = [
  { path: '/members/members', name: 'member-list', component: blank },
  { path: '/members/deleted-members', name: 'member-deleted-list', component: blank },
  { path: '/members/requested-members', name: 'member-requested-list', component: blank },
  { path: '/members/member', name: 'member-add', component: blank },
  { path: '/members/member/:pk', name: 'member-edit', component: blank },
  { path: '/members/request-member', name: 'member-request', component: blank },

  { path: '/members/contracts', name: 'contract-list', component: blank },
  { path: '/members/contract', name: 'contract-add', component: blank },
  { path: '/members/contract/:pk', name: 'contract-edit', component: blank },

  { path: '/members/modules', name: 'module-list', component: blank },
  { path: '/members/module', name: 'module-add', component: blank },
  { path: '/members/module/:pk', name: 'module-edit', component: blank },

  { path: '/members/module-parts', name: 'module-part-list', component: blank },
  { path: '/members/module-part', name: 'module-part-add', component: blank },
  { path: '/members/module-part/:pk', name: 'module-part-edit', component: blank },
]
