import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import customerImportResponse from "../../fixtures/customer_import";
import previewResponse from "../../fixtures/customer_import_preview";
import ImportForm from "@/views/customer/ImportForm.vue";

const readHeadResponse = {
  data: {
    "headers": [
      "Naam (klant)",
      "Klant ID",
      "Postcode",
      "Straat (klant)",
      "Woonplaats",
      "Contact",
      "Land (klant)",
      "E-mail",
      "Telefoon",
      "Mobiel"
    ],
    "mapping": {
      "Naam (klant)": "name",
      "Klant ID": "external_identifier",
      "Postcode": "postal",
      "Straat (klant)": "address",
      "Woonplaats": "city",
      "Contact": "contact",
      "Land (klant)": "country_code",
      "E-mail": "email",
      "Telefoon": "tel",
      "Mobiel": "mobile"
    }
  }
}

const allowedExtensions = {
  data: ['xls']
}

const tokenResponse = {
  data: {
    token: "bla"
  }
}

const requiredResponse = {
  data: ['name', 'address']
}

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/customer/import/required/':
      return Promise.resolve(requiredResponse)
    case '/customer/import/1/':
      return Promise.resolve(customerImportResponse)
    case '/customer/import/1/read_head/':
      return Promise.resolve(readHeadResponse)
    case '/get-csrf-token/':
      return Promise.resolve(tokenResponse)
    case '/customer/import/1/preview_import/':
      return Promise.resolve(previewResponse)
    case '/customer/import/get_allowed_extensions/':
      return Promise.resolve(allowedExtensions)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})

axios.patch.mockImplementation((url) => {
  switch (url) {
    case '/customer/import/1/':
      return Promise.resolve(customerImportResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})

describe('ImportForm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(ImportForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ImportForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "Import customer data"', async () => {
    const wrapper = mount(ImportForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Import customer data</h2>')
  })

  test('edit, contains "Edit purchase order"', async () => {
    const wrapper = mount(ImportForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Modify import data</h2>')
  })

  test('edit, click preview', async () => {
    const wrapper = mount(ImportForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    await wrapper.getComponent({ref: "submitUpdatePreview"}).trigger("click")

    await flushPromises()

    const html = wrapper.html()
    console.log(html)
    expect(html).to.contain('Existing customers</h3>')
    expect(html).to.contain('Problems found</h3>')

    const import_rows = wrapper.findAll('#preview-table-0 > tr.import-row')
    expect(import_rows.length).toEqual(1)

    const db_rows = wrapper.findAll('tr.database-row')
    expect(db_rows.length).toEqual(1)

  })

})
