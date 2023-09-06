import client from '@/services/api'

class VoidModel {
  constructor(data) {}
}

class BaseModel {
  axios = client
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

  model = VoidModel
  collection = []
  deletedItems = []
  editIndex = null
  isEdit = false
  editPk = null
  editItem = null

  // TODO: finish this for adding items in quotation form
  // TODO: also implement this for orderlines/infolines/etc
  deleteCollectionItem(index) {
    this.deletedItems.push(this.collection[index])
    this.collection.splice(index, 1)
  }
  editCollectionItem(item, index) {
    this.editIndex = index
    this.isEdit = true

    this.editItem = item
  }
  emptyCollectionItem() {
    this.editItem = new this.model({})
    this.editPk = null
  }
  doEditCollectionItem() {
    const newItem = new this.model({
      ...this.editItem
    })
    this.collection.splice(this.editIndex, 1, newItem)
    this.editIndex = null
    this.isEdit = false
    this.emptyCollectionItem()
  }
  addCollectionItem() {
    this.collection.push(new this.model({
      ...this.editItem
    }))
    this.emptyCollectionItem()
  }

  async emptyCollection() {
    for (let item of this.collection) {
      if (item.id) {
        await this.delete(item.id)
      }
    }
  }

  async updateCollection() {
    // create/update
    for (let item of this.collection) {
      if (item.id) {
        await this.update(item.id, item)
      } else {
        await this.insert(item)
      }
    }

    // deleted items
    for (const item of this.deletedItems) {
      if (item.id) {
        await this.delete(item.id)
      }
    }
  }
  // end TODO

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

  resetListArgs() {
    this.listArgs = []
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
    delete obj.created
    delete obj.modified
    return obj
  }

  async insert(obj) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post(this.url, this.preInsert(obj), headers).then(response => response.data)
  }

  preUpdate(obj) {
    delete obj.created
    delete obj.modified
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
