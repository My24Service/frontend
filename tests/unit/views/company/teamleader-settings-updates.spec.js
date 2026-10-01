import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import TeamleaderSettings from '@/views/company/TeamleaderSettings.vue'
import { TeamleaderService } from '@/models/company/Teamleader'

import { mountForm } from '../../support/form-harness.js'

// Each setting update answers with the piece of the config it changed. The
// page used to re-read the whole config after three of them (and so re-check
// the tokens and refetch the tax rates and categories) and, after a department
// change, did neither and kept showing the old department.

let configDetail

beforeEach(() => {
  configDetail = vi.spyOn(TeamleaderService.prototype, 'configDetail')
    .mockResolvedValue({ has_tokens: false, api_enabled: false, json_data: { department_name: 'Old' } })
})

afterEach(() => vi.restoreAllMocks())

async function open() {
  const wrapper = mountForm(TeamleaderSettings, {})
  await vi.waitFor(() => expect(wrapper.vm.settings.json_data).toBeDefined())
  configDetail.mockClear()
  return wrapper
}

test('a department change shows the department the answer names', async () => {
  vi.spyOn(TeamleaderService.prototype, 'updateDepartmentSetting')
    .mockResolvedValue({ department_uuid: 'd-2', department_name: 'Sales' })
  const wrapper = await open()

  await wrapper.vm.updateDepartmentSetting({ id: 'd-2', name: 'Sales' })

  expect(wrapper.vm.settings.json_data).toMatchObject({ department_uuid: 'd-2', department_name: 'Sales' })
})

test('the invoice template, product category and enabled updates take the answer instead of re-reading the config', async () => {
  vi.spyOn(TeamleaderService.prototype, 'updateInvoiceDocumentTemplateSetting')
    .mockResolvedValue({ invoice_template_uuid: 't-1', invoice_template_name: 'Default' })
  vi.spyOn(TeamleaderService.prototype, 'updateProductCategory')
    .mockResolvedValue({ product_category_uuid: 'c-9' })
  vi.spyOn(TeamleaderService.prototype, 'updateEnabled').mockResolvedValue({ api_enabled: true })
  const wrapper = await open()

  await wrapper.vm.updateInvoiceDocumentTemplateSetting({ id: 't-1', name: 'Default' })
  wrapper.vm.settings.json_data.product_category_uuid = 'c-9'
  await wrapper.vm.updateProductCategory()
  wrapper.vm.settings.api_enabled = true
  await wrapper.vm.updateEnabled()

  expect(configDetail).not.toHaveBeenCalled()
  expect(wrapper.vm.settings.api_enabled).toBe(true)
  expect(wrapper.vm.settings.json_data).toMatchObject({
    department_name: 'Old', invoice_template_uuid: 't-1', invoice_template_name: 'Default', product_category_uuid: 'c-9',
  })
})
