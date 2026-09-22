import { describe, expect, test, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import { ListPageHeader } from '@/features/table'
import { mountForm } from '../../support/form-harness.js'

/**
 * The shared list-screen header (src/features/table/ListPageHeader.vue).
 *
 * Mounted through a host: the header's search box is a `defineModel`, so it
 * needs a parent holding the other end of the `v-model:search-draft`.
 */

function mountHeader() {
  const refresh = vi.fn()
  const Host = defineComponent({
    components: { ListPageHeader },
    setup() {
      const searchDraft = ref('')
      return { refresh, searchDraft }
    },
    template: `
      <ListPageHeader
        v-model:search-draft="searchDraft"
        title="Sales users"
        search-label="Search sales users"
        :refresh="refresh"
      >
        <template #icon><span class="test-icon">ICON</span></template>
        <template #toolbar-extra><button type="button" class="test-extra">Download</button></template>
        <template #add><router-link to="/sales-users/add" class="btn btn-primary">Add sales user</router-link></template>
      </ListPageHeader>
    `,
  })
  return { wrapper: mountForm(Host, { deep: true }), refresh }
}

describe('ListPageHeader', () => {
  test('renders the title with the slotted icon', () => {
    const { wrapper } = mountHeader()

    expect(wrapper.find('h3').text()).toContain('Sales users')
    expect(wrapper.find('h3 .test-icon').text()).toBe('ICON')
  })

  test('labels the search input and writes what is typed back to the model', async () => {
    const { wrapper } = mountHeader()

    const input = wrapper.get('input[aria-label="Search sales users"]')
    expect(input.attributes('placeholder')).toBe('Search sales users')

    await input.setValue('jan')
    expect(wrapper.vm.searchDraft).toBe('jan')
  })

  test('the refresh button calls the refresh it was given', async () => {
    const { wrapper, refresh } = mountHeader()

    await wrapper.get('button[title="Refresh"]').trigger('click')

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  test('renders the add and toolbar-extra slots', () => {
    const { wrapper } = mountHeader()

    const add = wrapper.get('a[href="/sales-users/add"]')
    expect(add.text()).toContain('Add sales user')
    expect(wrapper.find('.test-extra').exists()).toBe(true)
  })
})
