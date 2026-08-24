import type { AxiosInstance, AxiosResponse } from 'axios'
import client from '@/services/api'

interface UpdateCollectionHooks {
  onInserted?: (item: any) => void
  onUpdated?: (item: any) => void
  onDeleted?: (item: any) => void
}

// The default `model`: a placeholder for subclasses that never set one. It
// ignores whatever it is constructed with, so it takes no parameters - a
// zero-arg constructor is still assignable to `model`'s type below.
class VoidModel {}

class BaseModel {
  axios: AxiosInstance = client
  component: any = null
  fields: Record<string, any> = {}
  url = ''
  listArgs: string[] = []
  queryArgs: Record<string, any> = {}
  searchQuery: string | null = null
  userFilter: string | null = null
  sort: string | null = null
  since: string | null = null
  currentPage = 1
  count = 0
  numPages = 0
  perPage = 20

  model: new (data?: any) => any = VoidModel
  collection: any[] = []
  deletedItems: any[] = []
  editIndex: number | null = null
  isEdit = false
  editPk: number | string | null = null
  editItem: any = null
  modelDefaults: Record<string, any> = {}
  beforeEditModel: any
  collectionHasChanges = false
  sortField: string | null = null
  sortOrder = 'asc'

  // TODO: finish this for managing items in invoice form
  // TODO: also implement this for orderlines/infolines/etc
  newEditItem(data?: any) {
    if (!data) {
      data = this.modelDefaults
    }
    this.editItem = new this.model(data)
  }
  cancelEdit() {
    this.isEdit = false
    this.emptyCollectionItem()
  }
  deleteCollectionItem(index: number) {
    // only mark for deletion when there's an id
    if (this.collection[index].id) {
      this.deletedItems.push(this.collection[index])
    }
    this.collection.splice(index, 1)
    this.collectionHasChanges = true
  }
  deleteCollectionItemByid(id: number | string) {
    const item = this.collection.find((m) => m.id === id)
    if (!item) {
      throw new Error(`deleteCollectionItemByid: item with id: ${id} not found`)
    }

    this.deletedItems.push(item)
    this.collection = this.collection.filter((m) => m.id !== id)
    this.collectionHasChanges = true
  }
  editCollectionItem(item: any, index: number) {
    this.beforeEditModel = {...item}
    this.editIndex = index
    this.isEdit = true

    this.editItem = item
  }
  getIndexById(id: number | string, idField: string) {
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
    const newItem: any = new this.model({
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

    this.collection.splice(this.editIndex as number, 1, newItem)
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
    for (const item of this.collection) {
      if (item.id) {
        await this.delete(item.id)
      }
    }
  }

  /**
   * Save the whole collection: insert new items, update existing ones, delete
   * the ones removed since the last load.
   *
   * `hooks` optionally takes onInserted/onUpdated/onDeleted callbacks, each
   * called with the item right after that item's request succeeds. They fire as
   * the loop goes rather than at the end, so a caller showing per-item feedback
   * keeps the feedback for items that succeeded before any later failure.
   */
  async updateCollection(hooks: UpdateCollectionHooks = {}) {
    const {onInserted, onUpdated, onDeleted} = hooks
    const newCollection: any[] = []

    // create/update
    for (const item of this.collection) {
      if (item.id && !item.new) {
        try {
          const newItem = await this.update(item.id, item)
          newItem.apiOk = true
          newCollection.push(newItem)
          if (onUpdated) onUpdated(newItem)
        } catch (error) {
          item.apiOk = false
          item.error = error
          newCollection.push(item)
          throw new Error(error as string)
        }
      } else {
        try {
          const newItem = await this.insert(item)
          newItem.apiOk = true
          newCollection.push(newItem)
          if (onInserted) onInserted(newItem)
        } catch (error) {
          item.apiOk = false
          item.error = error
          newCollection.push(item)
          throw new Error(error as string)
        }
      }
    }

    // deleted items
    for (const item of this.deletedItems) {
      if (item.id) {
        try {
          await this.delete(item.id)
          if (onDeleted) onDeleted(item)
        } catch (error) {
          // add to collection again on error (?)
          item.error = error
          newCollection.push(item)
          throw new Error(error as string)
        }
      }
    }

    return newCollection
  }
  // end TODO

  getFields() {
    return this.postCopyFields(JSON.parse(JSON.stringify(this.fields)))
  }

  postCopyFields(fields: Record<string, any>) {
    return fields
  }

  setComponent(component: any) {
    this.component = component
  }

  addListArg(arg: string) {
    this.listArgs.push(arg)
  }

  removeListArg(arg: string) {
    this.listArgs = this.listArgs.filter(thisArg => arg !== thisArg)
  }

  setListArgs(listArgs: string[]) {
    this.listArgs = [listArgs] as any
  }

  resetListArgs() {
    this.listArgs = []
  }

  setSorting(field: string, order: string, reset = true) {
    if (reset) {
      this.currentPage = 1
    }
    this.sortField = field
    this.sortOrder = order
  }

  getCsrfToken() {
    return this.axios.get('/get-csrf-token/').then((response) => response.data.token)
  }

  getHeaders(token?: string) {
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

  /**
   * Seed a freshly constructed model from the route's query string.
   *
   * List views are remounted on every page change (`:key="$route.fullPath"` on
   * the router-view), so a model that lives on the component - rather than as a
   * module-level singleton - starts each page with no search term and no sort.
   * The URL still carries them, so without this the search box keeps showing a
   * term the results behind it no longer honour (#313).
   */
  seedFromRoute(query: Record<string, string | undefined> = {}) {
    const paged = !!query.page
    this.currentPage = Number(query.page) || 1
    this.setSearchQuery(query.q || null, !paged)
    if (query.sort_field) {
      this.setSorting(query.sort_field, query.sort_dir || 'asc', !paged)
    }
  }

  setSearchQuery(query: string | null, reset = true) {
    if (reset) {
      this.currentPage = 1
    }
    this.searchQuery = query
  }

  setUserFilter(userFilter: string | null) {
    this.userFilter = userFilter
  }

  setSort(sort: string | null) {
    this.sort = sort
  }

  setSinceDate(since: string | null) {
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
      this.queryArgs['sort_dir'] = this.sortOrder
    }

    // HVG20250312:
    // After searching, or changing orders the `page=xxx` values starts accumulating to something
    // like `page=1&page=1&page=1`, which is not desired. So an extra pass is done here to ensure
    // that each key is only added once to the listArgs.
    const sanitizedArgs: Record<string, any> = {};

    for (const argIndex in this.listArgs) {
      // HVG20250319:
      // listArgs can be [ 'param1=value1', 'param2=value2' ], but it can also contain
      // [ 'param1=value1&param2=value2', 'param3=value3' ]
      const listArg = this.listArgs[ argIndex ];

      const assignments = listArg.indexOf('&') > 0
        ? listArg.split('&' )
        : [ listArg ];

      for (const assignment of assignments) {
        // Split on the FIRST '=' only: everything after it belongs to the value.
        // String.split('=', 2) cannot be used here - its limit argument truncates
        // rather than keeping the remainder, so 'q=a=b' would lose the '=b'.
        const separatorIndex = assignment.indexOf('=')

        if (separatorIndex === -1) {
          sanitizedArgs[assignment] = '';
        } else {
          sanitizedArgs[assignment.slice(0, separatorIndex)] = assignment.slice(separatorIndex + 1);
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
    const listArgs: string[] = []
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

  /**
   * List, shaped for a BFormSelect's `options`.
   *
   * The `{value, text}` pairs a select wants are a representation concern of
   * this model, not of whichever form happens to render the dropdown - the same
   * hand-rolled loop existed in ModulePartForm and MemberForm, against
   * different models, which is what makes this belong on the base class.
   *
   * Fields are named rather than fixed because not every list keys its label on
   * `name`; callers with a different label field pass it in.
   */
  async getSelectOptions({ valueField = 'id', textField = 'name' }: { valueField?: string, textField?: string } = {}) {
    const data = await this.list()

    return data.results.map((result: any) => ({
      value: result[valueField],
      text: result[textField],
    }))
  }

  async loadCollection() {
    const response = await this.list()
    this.collection = response.results.map((c: any) => new this.model(c))
    this.collectionHasChanges = false
    this.deletedItems = []
  }

  getDetailUrl(pk: number | string) {
    return `${this.url}${pk}/`
  }

  detail(pk: number | string) {
    return this.axios.get(this.getDetailUrl(pk)).then((response) => response.data)
  }

  preInsert(obj: any) {
    if (obj.hasOwnProperty('created')) {
      delete obj.created
    }
    if (obj.hasOwnProperty('modified')) {
      delete obj.modified
    }
    return obj
  }

  async insert(obj: any) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.post(this.url, this.preInsert(obj), headers).then((response: AxiosResponse) => response.data)
  }

  preUpdate(obj: any) {
    delete obj.created
    delete obj.modified
    return obj
  }

  async update(pk: number | string, obj: any) {
    return this.axios.patch(`${this.url}${pk}/`, this.preUpdate(obj))
      .then((response: AxiosResponse) => response.data)
  }

  async delete(pk: number | string) {
    const token = await this.getCsrfToken()
    const headers = this.getHeaders(token)

    return this.axios.delete(`${this.url}${pk}/`, headers)
  }
}

export default BaseModel
