import client, {rustClient} from '@/services/api'

class BaseModel {
  axios = client
  axiosRust = rustClient
  useRust = false
  component = null
  fields = {}
  url = ''
  listArgs = []
  queryArgs = []
  searchQuery = null
  sort = null

  currentPage = 1
  count = 0
  numPages = 0
  perPage = 20

  getClient() {
    if (this.useRust) {
      return this.axiosRust
    } else {
      return this.axios
    }
  }

  getFields() {
    return this.postCopyFields(JSON.parse(JSON.stringify(this.fields)))
  }

  postCopyFields(fields) {
    return fields
  }

  setComponent(component) {
    this.component = component
  }

  addListArg(arg) {
    this.listArgs.push(arg)
  }

  removeListArg(arg) {
    this.listArgs = this.listArgs.filter(thisArg => arg !== thisArg)
  }

  setListArgs(listArgs) {
    this.listArgs = [listArgs]
  }

  getCsrfToken() {
    return this.axios.get('/get-csrf-token/').then((response) => response.data.token)
  }

  getHeaders(token) {
    if (token) {
      return {
        headers: {
          'X-CSRFToken': token,
          'Content-Type': 'application/json'
        }
      }
    }

    return {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  }

  setSearchQuery(query) {
    this.currentPage = 1
    this.searchQuery = query
  }

  setSort(sort) {
    this.sort = sort
  }

  getListUrl() {
    return this.url
  }

  async list() {
    let listArgs = []

    listArgs.push(`page=${this.currentPage}`)

    if (this.searchQuery) {
      listArgs.push(`q=${this.searchQuery}`)
    }

    if (this.sort) {
      listArgs.push(`order_by=${this.sort}`)
    }

    if (this.listArgs.length) {
      for (const arg of this.listArgs) {
        listArgs.push(arg)
      }
    }

    const url = `${this.getListUrl()}?${listArgs.join('&')}`

    const response = await this.getClient().get(url)

    if ('count' in response.data) {
      this.count = response.data.count
    }

    if ('num_pages' in response.data) {
      this.numPages = response.data.num_pages
    }

    return response.data
  }

  getDetailUrl(pk) {
    return `${this.url}${pk}/`
  }

  detail(pk) {
    return this.axios.get(this.getDetailUrl(pk)).then((response) => response.data)
  }

  preInsert(obj) {
    return obj
  }

  async insert(obj) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post(this.url, this.preInsert(obj), headers).then(response => response.data)
  }

  preUpdate(obj) {
    return obj
  }

  async update(pk, obj) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.patch(`${this.url}${pk}/`, this.preUpdate(obj), headers).then((response) => response.data)
  }

  async delete(pk) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.delete(`${this.url}${pk}/`, headers)
  }
}

export default BaseModel
