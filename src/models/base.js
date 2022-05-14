import axios from '@/services/api'

// // Add a response interceptor
// axios.interceptors.response.use(function (response) {
//     // Any status code that lie within the range of 2xx cause this function to trigger
//     // Do something with response data
//     return response;
//   }, function (error) {
//     console.log('error in response interceptors', error)
//     // Any status codes that falls outside the range of 2xx cause this function to trigger
//     // Do something with response error
//     return Promise.reject(error);
//   }
// )

// // Add a request interceptor
// axios.interceptors.request.use(function (config) {
//     // Do something before request is sent
//     return config;
//   }, function (error) {
//     console.log('error in request interceptors', error)
//     // Do something with request error
//     return Promise.reject(error);
//   }
// )


class BaseModel {
  axios = axios
  component = null
  fields = {}
  url = ''
  listArgs = null
  queryArgs = []
  searchQuery = null
  sort = null

  currentPage = 1
  count = 0
  numPages = 0
  perPage = 20

  getFields() {
    return this.postCopyFields(JSON.parse(JSON.stringify(this.fields)))
  }

  postCopyFields(fields) {
    return fields
  }

  setComponent(component) {
    this.component = component
  }

  setListArgs(listArgs) {
    this.listArgs = listArgs
  }

  getCsrfToken() {
    return axios.get('/get-csrf-token/').then((response) => response.data.token)
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

    if (this.listArgs) {
      listArgs.push(this.listArgs)
    }

    const url = `${this.getListUrl()}?${listArgs.join('&')}`

    const response = await this.axios.get(url)

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

    return this.axios.put(`${this.url}${pk}/`, this.preUpdate(obj), headers).then((response) => response.data)
  }

  async delete(pk) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.delete(`${this.url}${pk}/`, headers)
  }
}

export default BaseModel
