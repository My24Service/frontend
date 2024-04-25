import BaseModel from '@/models/base'

class CustomerTemplateModel {
  id
  name
  description
  file
  template_type
  is_active
  created
  modified
}


class CustomerTemplateService extends BaseModel {
  url = '/company/customer-template/'
  queryMode = 'all'

  removeNullFields(obj) {
    for (const [field, value] of Object.entries(obj)) {
      if (!value) {
        delete obj[field]
      }
    }
    return obj
  }

  preInsert(obj) {
    if (obj.hasOwnProperty('created')) {
      delete obj.created
    }
    if (obj.hasOwnProperty('modified')) {
      delete obj.modified
    }
    obj = this.removeNullFields(obj)
    return obj
  }

  preUpdate(obj) {
    delete obj.created
    delete obj.modified
    obj = this.removeNullFields(obj)
    return obj
  }

  async previewPdfTemplate(data) {
    const url = `${this.url}preview_template_pdf/`
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post(url, data, headers).then((response) => response.blob())
  }
}

export { CustomerTemplateService, CustomerTemplateModel }
