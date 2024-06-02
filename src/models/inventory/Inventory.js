import BaseModel from '@/models/base'


class InventoryService extends BaseModel {
  fields = {
    'location': null,
    'material': null,
    'amount': 0,
    'modified': null
  }

  url = null

  getLocations(query) {
    if (!query) {
      query = ''
    }

    const url = `/inventory/inventory-locations/?q=${query}`

    return this.axios.get(url).then((result) => result.data)
  }

  getMaterials(query) {
    if (!query) {
      query = ''
    }

    const url = `/inventory/inventory-materials/?q=${query}`

    return this.axios.get(url).then((result) => result.data)
  }

  getLocationsForMaterial(material_pk) {
    const url = `/inventory/inventory-locations-for-material/?material=${material_pk}`

    return this.axios.get(url).then((result) => result.data)
  }

  getMaterialsForLocation(stocklocation_pk, query) {
    if (!stocklocation_pk) {
      return;
    }

    if (!query) {
      query = ''
    }

    const url = `/inventory/inventory-materials-for-location/?location=${stocklocation_pk}&q=${query}`
    return this.axios.get(url).then((result) => result.data)
  }
}

let inventoryModel = new InventoryService()

export default inventoryModel
export { InventoryService }
