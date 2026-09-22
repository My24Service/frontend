/**
 * Move focus into a freshly opened editor: its first input, else its first
 * button. The popover mounts the editor after the click that opened it, so
 * this runs a tick later than the editor's own `onMounted`.
 */
export function focusFirstControl(root: HTMLElement | null | undefined) {
  if (!root) return
  const control = root.querySelector<HTMLElement>('input:not([type="hidden"]), button')
  control?.focus()
}
