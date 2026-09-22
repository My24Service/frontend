import { flushPromises } from '@vue/test-utils'

/**
 * Driving the column-filter bar (src/features/table/filters/) from a spec,
 * through its DOM: the "Filter" menu adds a chip, the chip opens its editor
 * in a popover, the editor applies as it goes.
 *
 * `BPopover` renders in place unless told to teleport, so — unlike the
 * modals in ./modal.js — the editor is inside the mounted wrapper and
 * ordinary `wrapper.find` reaches it.
 *
 * **Mount with `stubs: {transition: false}`.** The popover's `shown` and
 * `hidden` — which focus the editor and drop an empty chip — fire from its
 * `<Transition>` hooks. Vue Test Utils stubs every `<transition>` by default,
 * and the stub runs no hooks: the editor then never takes focus and a
 * dismissed chip never leaves. With the real transition, happy-dom reports
 * no CSS duration and Vue resolves each phase over animation frames, which
 * `settleTransitions` below waits out.
 */

/** Let a popover's open or close finish: a few animation frames, then the microtasks. */
export async function settleTransitions() {
  for (let frame = 0; frame < 4; frame++) await new Promise((resolve) => setTimeout(resolve, 20))
  await flushPromises()
}

/** Pick `label` from the bar's "Filter" menu; its chip appears with the editor open. */
export async function addFilter(wrapper, label) {
  await wrapper.get('.column-filter-bar .dropdown-toggle').trigger('click')
  await flushPromises()
  const item = wrapper.findAll('.column-filter-bar .dropdown-item').find((candidate) => candidate.text() === label)
  if (!item) {
    const labels = wrapper.findAll('.column-filter-bar .dropdown-item').map((candidate) => candidate.text())
    throw new Error(`no filter '${label}' in the menu — it offers ${JSON.stringify(labels)}`)
  }
  await item.trigger('click')
  // The chip mounts, then opens its popover a tick later, which mounts the editor.
  await settleTransitions()
}

/** The labels the "Filter" menu offers right now. */
export async function offeredFilters(wrapper) {
  const toggle = wrapper.find('.column-filter-bar .dropdown-toggle')
  if (!toggle.exists()) return []
  await toggle.trigger('click')
  await flushPromises()
  const labels = wrapper.findAll('.column-filter-bar .dropdown-item').map((item) => item.text())
  await toggle.trigger('click')
  await flushPromises()
  return labels
}

/** The chips on the bar, as `Label: value` strings. */
export function chipTexts(wrapper) {
  return wrapper.findAll('.filter-chip').map((chip) => {
    const label = chip.get('.filter-chip-label').text()
    const value = chip.get('.filter-chip-value').text()
    return `${label}: ${value}`
  })
}

/** A handle on the chip labelled `label`. */
export function chip(wrapper, label) {
  const find = () => {
    const match = wrapper.findAll('.filter-chip').find((candidate) => candidate.get('.filter-chip-label').text() === label)
    if (!match) throw new Error(`no chip '${label}' on the bar — it shows ${JSON.stringify(chipTexts(wrapper))}`)
    return match
  }
  return {
    exists: () => wrapper.findAll('.filter-chip').some((candidate) => candidate.get('.filter-chip-label').text() === label),
    value: () => find().get('.filter-chip-value').text(),
    async open() {
      await find().get('.filter-chip-main').trigger('click')
      await settleTransitions()
    },
    async remove() {
      await find().get('.filter-chip-remove').trigger('click')
      await flushPromises()
    },
  }
}

/** The open editor's input for `columnId` (`Filter <id>`, or `Filter <id> from` / `to` for a range). */
export function editorInput(wrapper, columnId, end = '') {
  const label = end ? `Filter ${columnId} ${end}` : `Filter ${columnId}`
  return wrapper.get(`.column-filter-popover input[aria-label="${label}"]`)
}

/** Press a mode button (Exactly / Between / Month / ...) in the open editor. */
export async function pickMode(wrapper, text) {
  const label = wrapper.findAll('.column-filter-popover .filter-mode label').find((candidate) => candidate.text() === text)
  if (!label) throw new Error(`no mode '${text}' in the open editor`)
  const input = wrapper.get(`#${CSS.escape(label.attributes('for'))}`)
  await input.setValue(true)
  await flushPromises()
}

/** Close the open editor the way a user would: Escape. */
export async function closeEditor(wrapper) {
  await wrapper.get('.filter-chip-editor').trigger('keydown', { key: 'Escape' })
  await settleTransitions()
}
