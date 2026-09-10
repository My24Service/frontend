import { watch, type Ref } from 'vue'
import { useToast } from 'bootstrap-vue-next'
import { errorToast } from '@/services/i18n'

/**
 * Surface a query's failure as a toast — the watcher every form and detail
 * view wrote out by hand, once per read.
 */
export function useQueryErrorToast(error: Ref<unknown>, message: string): void {
  const { create } = useToast()
  watch(error, (value) => {
    if (value) errorToast(create, message)
  })
}
