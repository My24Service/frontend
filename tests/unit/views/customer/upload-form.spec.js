import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import customerUploadResponse from "../../fixtures/customer_upload";
import previewResponse from "../../fixtures/customer_upload_preview";
import UploadForm from "@/views/customer/UploadForm.vue";

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
    case '/customer/upload/required/':
      return Promise.resolve(requiredResponse)
    case '/customer/upload/1/':
      return Promise.resolve(customerUploadResponse)
    case '/customer/upload/1/read_head/':
      return Promise.resolve(readHeadResponse)
    case '/get-csrf-token/':
      return Promise.resolve(tokenResponse)
    case '/customer/upload/1/preview_upload/':
      return Promise.resolve(previewResponse)
    case '/customer/upload/get_allowed_extensions/':
      return Promise.resolve(allowedExtensions)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})

axios.patch.mockImplementation((url) => {
  switch (url) {
    case '/customer/upload/1/':
      return Promise.resolve(customerUploadResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})

describe('UploadForm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(UploadForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UploadForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "Upload customer data"', async () => {
    const wrapper = mount(UploadForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Upload customer data</h2>')
  })

  test('edit, contains "Edit purchase order"', async () => {
    const wrapper = mount(UploadForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Modify upload data</h2>')
  })

  test('edit, click preview', async () => {
    const wrapper = mount(UploadForm, {
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

    const upload_rows = wrapper.findAll('#preview-table-0 > tr.upload-row')
    expect(upload_rows.length).toEqual(1)

    const db_rows = wrapper.findAll('tr.database-row')
    expect(db_rows.length).toEqual(1)

  })

})
