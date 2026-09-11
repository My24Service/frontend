import { beforeEach, describe, expect, test, vi } from 'vitest'

import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { modal } from '../../support/modal.js'

/**
 * The shared delete-confirm modal (src/features/table/ListDeleteModal.vue).
 *
 * The destroy mutation is a fake behind the same seam the composable calls:
 * `useListDelete` spreads `destroyMutation()` into `useMutation` and fires
 * `mutateAsync({path: {id}})`, so a `{mutationKey, mutationFn}` object is
 * everything it needs. What the specs pin is the modal's half of the pinned
 * guards — nothing fires before the OK, a double OK fires once (the
 * `isPending` guard in `doDelete`), and success toasts, invalidates and
 * closes.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const MODAL_ID = 'delete-shell-modal'

let mutationFn
let invalidate

beforeEach(() => {
  mutationFn = vi.fn(async () => ({}))
  invalidate = vi.fn(async () => {})
})

async function mountDeleteModal() {
  const wrapper = await mountListView(ListDeleteModal, {
    deep: true,
    props: {
      modalId: MODAL_ID,
      confirmText: 'Are you sure you want to delete this thing?',
      destroyMutation: () => ({ mutationKey: ['shell-delete'], mutationFn }),
      invalidate,
      deletedDetail: 'Thing has been deleted',
      deleteError: 'Error deleting thing',
    },
  })
  await settle()
  return wrapper
}

describe('ListDeleteModal', () => {
  test('keeps the per-screen modal id and the confirm copy', async () => {
    await mountDeleteModal()

    const element = document.getElementById(MODAL_ID)
    expect(element).not.toBeNull()
    expect(element.textContent).toContain('Are you sure you want to delete this thing?')
  })

  test('confirming deletes the shown row, toasts, invalidates and closes', async () => {
    const wrapper = await mountDeleteModal()

    wrapper.vm.showDeleteModal(7)
    await settle()
    expect(modal(MODAL_ID).isOpen()).toBe(true)

    modal(MODAL_ID).ok()
    await settle()
    await settle()

    expect(mutationFn).toHaveBeenCalledTimes(1)
    // TanStack calls mutationFn(variables, context) — the id rides the first arg.
    expect(mutationFn.mock.calls[0][0]).toEqual({ path: { id: 7 } })
    expect(toasts().map((toast) => toast.body)).toContain('Thing has been deleted')
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(modal(MODAL_ID).isOpen()).toBe(false)
  })

  test('cancelling deletes nothing and tells no one', async () => {
    const wrapper = await mountDeleteModal()

    wrapper.vm.showDeleteModal(7)
    await settle()

    modal(MODAL_ID).cancel()
    await settle()

    expect(mutationFn).not.toHaveBeenCalled()
    expect(toasts()).toEqual([])
    expect(invalidate).not.toHaveBeenCalled()
  })

  test('a second OK while the delete is in flight fires nothing more', async () => {
    const wrapper = await mountDeleteModal()
    let release
    mutationFn.mockImplementation(() => new Promise((resolve) => { release = resolve }))

    wrapper.vm.showDeleteModal(7)
    await settle()

    modal(MODAL_ID).ok()
    await settle()
    modal(MODAL_ID).ok()
    release({})
    await settle()
    await settle()

    expect(mutationFn).toHaveBeenCalledTimes(1)
    expect(toasts().map((toast) => toast.body)).toContain('Thing has been deleted')
  })
})
