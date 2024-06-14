import BaseModel from '@/models/base'

class TemplateModel {
  constructor(param) {

  }

  id
  name
  description
  file
  template_type
  is_active
  created
  modified
}


class TemplateService extends BaseModel {
  url = '/company/template/'
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
    headers.responseType = 'blob'

    return this.axios.post(url, data, headers).then((response) => {
      return new Blob([response.data], { type: 'application/pdf' })
    });
  }
}

export { TemplateService, TemplateModel }
