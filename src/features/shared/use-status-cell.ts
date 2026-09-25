/** The row fields a status cell reads. Both the invoice and the order rows carry these. */
export interface StatusRow {
  id: number
  last_status: string
  last_status_full?: string | null
  statuscode_id?: number | null
  color?: string | null
}

/**
 * The select/pending/rollback behind a status cell: which code is current,
 * what the select shows, and what a pick does.
 *
 * The select shows the attempted status while the write is in flight; once it
 * answers, the display follows the row again — a failed write rolls it back
 * to the row's status rather than displaying a value nothing stored. The one
 * deliberate difference between the adopters lives in `keepOptimisticOnSuccess`:
 * the invoice cell falls back to the row's status as soon as its write lands
 * (the invalidated list re-reads the row), while the order cell keeps showing
 * the chosen status until the list reload answers for it.
 */
export function useStatusCell(config: {
  row: () => StatusRow
  statuscodes: () => Api.Statuscode[]
  /** Codes the picker offers but refuses: the invoice's automatic ones. */
  isDisabledOption?: (code: Api.Statuscode) => boolean
  /** Posts the chosen status. */
  write: (status: string) => Promise<unknown>
  keepOptimisticOnSuccess?: boolean
  onSuccess?: (status: string) => void | Promise<unknown>
  onError?: () => void
}) {
  // The row carries its statuscode id and colour, so the current option is the
  // code with that id and the dot is the row's colour — no string matching. A
  // row nothing resolved keeps its raw status as a disabled option.
  const currentCode = computed(
    () => config.statuscodes().find((code) => code.id === config.row().statuscode_id) ?? null,
  )
  const current = computed(() => currentCode.value?.statuscode ?? config.row().last_status)
  const selected = ref(current.value)
  watch(current, (value) => { selected.value = value })
  const color = computed(() => config.row().color ?? '#ccc')

  const isPending = ref(false)

  async function change(event: Event) {
    const select = event.target
    if (!(select instanceof HTMLSelectElement)) return
    const code = config.statuscodes().find((item) => item.statuscode === select.value)
    if (!code || code.statuscode === current.value || isPending.value) {
      select.value = selected.value
      return
    }
    if (config.isDisabledOption?.(code)) {
      select.value = selected.value
      return
    }
    selected.value = code.statuscode
    isPending.value = true
    try {
      await config.write(code.statuscode)
      if (!config.keepOptimisticOnSuccess) selected.value = current.value
      await config.onSuccess?.(code.statuscode)
    } catch {
      selected.value = current.value
      select.value = current.value
      config.onError?.()
    } finally {
      isPending.value = false
    }
  }

  return { currentCode, current, selected, color, isPending, change }
}
