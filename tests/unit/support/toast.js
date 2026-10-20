import { vi } from 'vitest'

/**
 * The spy behind useToast().create, for every spec.
 *
 * setupTests.js mocks bootstrap-vue-next once for the whole suite so that
 * useToast() hands this spy out; specs read it through form-harness.js
 * (`toastCreate`, `toastTitles`, `toasts`).
 *
 * It lives in a module of its own, with no imports but vitest, because the
 * mock factory that reaches it runs while bootstrap-vue-next is still loading.
 * A factory that awaits a module whose graph reaches bootstrap-vue-next again
 * (form-harness.js does, through the stores) hangs the run with no output.
 */
export const toastCreate = vi.fn()
