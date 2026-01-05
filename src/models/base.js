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
  since = null
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
    // only mark for deletion when there's an id
    if (this.collection[index].id) {
      this.deletedItems.push(this.collection[index])
    }
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

    const itemChanges = Object.entries(newItem).find(
      ([k, v]) => k.indexOf('dinero') === -1 && k !== 'id' && this.beforeEditModel[k] !== v
    )
    // console.log({itemChanges})
    const itemHasChanges = !!(itemChanges && itemChanges.length > 0)
    newItem.hasChanges = itemHasChanges

    // update collection changes only when needed
    if (!this.collectionHasChanges && itemHasChanges) {
      this.collectionHasChanges = true
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
          throw new Error(error)
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
          throw new Error(error)
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
          throw new Error(error)
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

  setSorting(field, sortDesc, reset=true) {
    if (reset) {
      this.currentPage = 1
    }
    this.sortField = field
    this.sortDesc = sortDesc === 'desc'
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

  setSearchQuery(query, reset=true) {
    if (reset) {
      this.currentPage = 1
    }
    this.searchQuery = query
  }

  setUserFilter(userFilter) {
    this.userFilter = userFilter
  }

  setSort(sort) {
    this.sort = sort
  }

  setSinceDate(since) {
    this.since = since
  }

  getListUrl() {
    return this.url
  }

  getQueryArgs() {
    this.queryArgs = {};
    this.queryArgs['page'] = this.currentPage;

    if (this.searchQuery) {
      this.queryArgs['q']= this.searchQuery;
    }

    if (this.userFilter) {
      this.queryArgs['user_filter'] = this.userFilter;
    }

    if (this.sort) {
      this.queryArgs['order_by'] = this.sort;
    }

    if (this.since) {
      this.queryArgs['since'] = this.since;
    }

    if (this.sortField !== null) {
      this.queryArgs['sort_field'] = this.sortField
      this.queryArgs['sort_dir'] = this.sortDesc ? 'desc' : 'asc'
    }

    // HVG20250312:
    // After searching, or changing orders the `page=xxx` values starts accumulating to something
    // like `page=1&page=1&page=1`, which is not desired. So an extra pass is done here to ensure
    // that each key is only added once to the listArgs.
    const sanitizedArgs = {};

    for (const argIndex in this.listArgs) {
      // HVG20250319:
      // listArgs can be [ 'param1=value1', 'param2=value2' ], but it can also contain
      // [ 'param1=value1&param2=value2', 'param3=value3' ]
      const listArg = this.listArgs[ argIndex ];

      let assignments = listArg.indexOf('&') > 0
        ? listArg.split('&' )
        : [ listArg ];

      for (const assignment in assignments) {
        const keyValue = assignments[assignment].split( '=', 2 )
        if (keyValue.length === 1) {
          sanitizedArgs[keyValue[0]] = '';
        } else if (keyValue.length === 2) {
          sanitizedArgs[keyValue[0]] = keyValue[1];
        }
      }
    }

    for (const arg in this.queryArgs) {
      sanitizedArgs[ arg ] = this.queryArgs[ arg ];
    }

    return sanitizedArgs
  }

  async list() {
    const sanitizedArgs = this.getQueryArgs()

    // Start building up the listArgs from the sanitized list of arguments.
    const listArgs = []
    for (const arg in sanitizedArgs) {
      listArgs.push( `${arg}=${sanitizedArgs[arg]}` );
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
