import BaseModel from '@/models/base'


class Inventory extends BaseModel {
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

    return new Promise((resolve, reject) => {
      this.axios.get(url).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(error)
      })
    })
  }

  getMaterials(query) {
    if (!query) {
      query = ''
    }

    const url = `/inventory/inventory-materials/?q=${query}`

    return new Promise((resolve, reject) => {
      this.axios.get(url).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(error)
      })
    })
  }

  getLocationsForMaterial(material_pk) {
    const url = `/inventory/inventory-locations-for-material/?material=${material_pk}`

    return new Promise((resolve, reject) => {
      this.axios.get(url).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(error)
      })
    })
  }

  getMaterialsForLocation(stocklocation_pk, query) {
    if (!stocklocation_pk) {
      return;
    }

    if (!query) {
      query = ''
    }

    const url = `/inventory/inventory-materials-for-location/?location=${stocklocation_pk}&q=${query}`
    return new Promise((resolve, reject) => {
      this.axios.get(url).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(error)
      })
    })
  }
}

let inventoryModel = new Inventory()

export default inventoryModel
