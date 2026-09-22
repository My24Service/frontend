export type QueryErrorMessage = string | ((error: unknown) => string)

export function useQueryErrorToast(error: Ref<unknown>, message: QueryErrorMessage): void {
  const { create } = useToast()
  watch(error, (value) => {
    if (!value) return
    errorToast(create, typeof message === 'function' ? message(value) : message)
  })
}
