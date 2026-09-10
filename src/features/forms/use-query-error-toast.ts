import { watch, type Ref } from 'vue'
import { useToast } from 'bootstrap-vue-next'
import { errorToast } from '@/services/i18n'

/**
 * The body of the failure toast: a fixed label, or a builder for the reads
 * whose message carries the failure itself (the maintenance-contract view
 * appends the response's status).
 */
export type QueryErrorMessage = string | ((error: unknown) => string)

/**
 * Surface a query's failure as a toast — the watcher every form and detail
 * view wrote out by hand, once per read.
 */
export function useQueryErrorToast(error: Ref<unknown>, message: QueryErrorMessage): void {
  const { create } = useToast()
  watch(error, (value) => {
    if (!value) return
    errorToast(create, typeof message === 'function' ? message(value) : message)
  })
}
