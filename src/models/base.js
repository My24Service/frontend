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

  getHeaders() {
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

  list() {
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

    return new Promise((resolve, reject) => {
      this.axios.get(url).then((response) => {
        if ('count' in response.data) {
          this.count = response.data.count
        }

        if ('num_pages' in response.data) {
          this.numPages = response.data.num_pages
        }

        resolve(response.data)
      }).catch((error) => {
        reject(error)
      })
    })
  }

  getDetailUrl(pk) {
    return `${this.url}${pk}/`
  }

  detail(pk) {
    return new Promise((resolve, reject) => {
      this.axios.get(this.getDetailUrl(pk))
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        reject(error)
      })
    })
  }

  preInsert(obj) {
    return obj
  }

  insert(token, obj) {
    const headers = this.getHeaders(token)

    // pre-process data
    obj = this.preInsert(obj)

    return new Promise((resolve, reject) => {
      this.axios.post(this.url, obj, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  preUpdate(obj) {
    return obj
  }

  update(token, pk, obj) {
    const headers = this.getHeaders(token)

    // pre-process data
    obj = this.preUpdate(obj)

    return new Promise((resolve, reject) => {
      this.axios.put(`${this.url}${pk}/`, obj, headers)
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  delete(token, pk) {
    const headers = this.getHeaders(token)

    return new Promise((resolve, reject) => {
      this.axios.delete(`${this.url}${pk}/`, headers)
        .then(() => {
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}

export default BaseModel
