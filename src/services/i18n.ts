/**
 * Translation and toast helpers.
 *
 * Infrastructure rather than a feature: `$trans` reads the page's Django
 * catalogue, and the two toasts raise a message through a `create` the caller
 * got from `useToast()`. Neither touches a store, a model or the router.
 *
 * That is the point of the module. They used to live in `src/utils.js`, which
 * imports the orders model, the auth store and the main store, so every kit and
 * leaf module that only wanted a translated label or a toast evaluated those
 * domain modules at load (feature-refactoring plan, unit 2.3).
 *
 * `toDinero` lived here too until it moved to `src/services/money.ts`: money
 * formatting is not translation, and the filename only described the first of
 * the two jobs.
 */

// Django's jsi18n bundle (`/api/jsi18n/`, loaded in src/main.ts) defines
// `django` as a page global, and the main store publishes the member's own text
// overrides on `window.member_type_text`.
declare global {
  /** `gettext` from Django's jsi18n bundle. */
  const django: { gettext: (text: string) => string }
  interface Window {
    django?: { gettext: (text: string) => string }
    member_type_text?: Record<string, string>
  }
}

/**
 * What the toast helpers need from `useToast().create`. Structural on purpose:
 * this module stays free of a bootstrap-vue-next import, so nothing that only
 * wants a translated label pulls the component library into its graph.
 */
type ToastCreator = (options: { title: string, body: string, variant: 'success' | 'danger' }) => unknown

export function $trans(text: string) {
  if (!window.django) {
    return text
  }

  if (window.member_type_text && text in window.member_type_text) {
    return django.gettext(window.member_type_text[text])
  }

  return django.gettext(text)
}

/**
 * Fills `%(name)s` placeholders, the format Django's own `interpolate` reads,
 * so a translator sees the placeholder in the .po and may move it. Written
 * here rather than read off the jsi18n bundle so it works when the bundle
 * is absent (tests, the login page before the catalogue loads).
 */
export function interpolate(format: string, params: Record<string, string | number>) {
  return format.replace(/%\((\w+)\)s/g, (match, name: string) =>
    name in params ? String(params[name]) : match)
}

export function infoToast(create: ToastCreator, title: string, body: string) {
  create({title, body, variant: 'success'})
}

export function errorToast(create: ToastCreator, body: string, title=$trans('Error')) {
  create({title, body, variant: 'danger'})
}
