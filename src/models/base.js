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
  userFilter = null
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
  modelDefaults = {}
  beforeEditModel
  collectionHasChanges = false
  sortField = null
  sortDesc = false

  // TODO: finish this for managing items in invoice form
  // TODO: also implement this for orderlines/infolines/etc
  newEditItem(data) {
    if (!data) {
      data = this.modelDefaults
    }
    this.editItem = new this.model(data)
  }
  cancelEdit() {
    this.isEdit = false
    this.emptyCollectionItem()
  }
  deleteCollectionItem(index) {
    this.deletedItems.push(this.collection[index])
    this.collection.splice(index, 1)
    this.collectionHasChanges = true
  }
  deleteCollectionItemByid(id) {
    const item = this.collection.find((m) => m.id === id)
    if (!item) {
      throw `deleteCollectionItemByid: item with id: ${id} not found`
    }

    this.deletedItems.push(item)
    this.collection = this.collection.filter((m) => m.id !== id)
    this.collectionHasChanges = true
  }
  editCollectionItem(item, index) {
    this.beforeEditModel = {...item}
    this.editIndex = index
    this.isEdit = true

    this.editItem = item
  }
  getIndexById(id, idField) {
    for (let i=0; i<this.collection.length; i++) {
      if (this.collection[i][idField] === id) {
        return i
      }
    }
  }
  emptyCollectionItem() {
    this.newEditItem()
    this.editPk = null
  }
  doEditCollectionItem() {
    const newItem = new this.model({
      ...this.editItem
    })

    if (!this.collectionHasChanges) {
      const changes = Object.entries(newItem).find(
        ([k, v]) => k.indexOf('dinero') === -1 && k !== 'id' && this.beforeEditModel[k] !== v
      )
      console.log({changes})
      this.collectionHasChanges = !!(changes && changes.length > 0)
    }

    this.collection.splice(this.editIndex, 1, newItem)
    this.editIndex = null
    this.isEdit = false
    this.emptyCollectionItem()
  }

  async doDirectEditCollectionItem() {
    await this.update(this.editItem.id, this.editItem)
    this.editIndex = null
    this.isEdit = false
    this.emptyCollectionItem()
  }

  addCollectionItem() {
    this.collection.push(this.editItem)
    this.emptyCollectionItem()
    this.collectionHasChanges = true
  }

  async addDirectCollectionItem() {
    const newModel = await this.insert(this.editItem)
    this.emptyCollectionItem()
    return newModel
  }

  async emptyCollection() {
    for (let item of this.collection) {
      if (item.id) {
        await this.delete(item.id)
      }
    }
  }

  async updateCollection() {
    let newCollection = []
    // create/update
    for (let item of this.collection) {
      if (item.id && !item.new) {
        try {
          let newItem = await this.update(item.id, item)
          newItem.apiOk = true
          newCollection.push(newItem)
        } catch (error) {
          item.apiOk = false
          item.error = error
          newCollection.push(item)
        }
      } else {
        try {
          const newItem = await this.insert(item)
          newItem.apiOk = true
          newCollection.push(newItem)
        } catch (error) {
          item.apiOk = false
          item.error = error
          newCollection.push(item)
        }
      }
    }

    // deleted items
    for (const item of this.deletedItems) {
      if (item.id) {
        try {
          await this.delete(item.id)
        } catch (error) {
          // add to collection again on error (?)
          item.error = error
          newCollection.push(item)
        }
      }
    }

    return newCollection
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

  setSorting(field, sortDesc) {
    this.sortField = field
    this.sortDesc = sortDesc
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

  setUserFilter(userFilter) {
    this.userFilter = userFilter
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

    if (this.userFilter) {
      listArgs.push(`user_filter=${this.userFilter}`)
    }

    if (this.sort) {
      listArgs.push(`order_by=${this.sort}`)
    }

    if (this.listArgs.length) {
      for (const arg of this.listArgs) {
        listArgs.push(arg)
      }
    }

    if (this.sortField !== null) {
      listArgs.push(`sort_field=${this.sortField}`)
      listArgs.push(`sort_dir=${this.sortDesc ? 'desc' : 'asc'}`)
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

  async loadCollection() {
    const response = await this.list()
    this.collection = response.results.map((c) => new this.model(c))
    this.collectionHasChanges = false
    this.deletedItems = []
  }

  getDetailUrl(pk) {
    return `${this.url}${pk}/`
  }

  detail(pk) {
    return this.axios.get(this.getDetailUrl(pk)).then((response) => response.data)
  }

  preInsert(obj) {
    if (obj.hasOwnProperty('created')) {
      delete obj.created
    }
    if (obj.hasOwnProperty('modified')) {
      delete obj.modified
    }
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
