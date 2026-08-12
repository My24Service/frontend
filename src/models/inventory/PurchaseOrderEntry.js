import moment from 'moment'
import BaseModel from '@/models/base'


class PurchaseOrderEntry extends BaseModel {
  fields = {
    'purchase_order': null,
    'purchase_order_material': null,
    'material_name': null,
    'purchase_order_material_view': {
      'name': "",
      'unit': "",
      "amount": 0
    },
    'amount': 0,
    'entry_date': moment().toDate(),
    'stock_location': null,
    'stock_location_name': null
  }

  url = '/inventory/purchaseorder-entry/'

  postCopyFields(fields) {
    fields.entry_date = moment().toDate()
    return fields
  }

  /**
   * Build one entry per material of a purchase order.
   *
   * Receiving a purchase order means booking in what was ordered, so each of
   * its materials starts as an entry for the full ordered amount. The ordered
   * amount is kept alongside so the form can show what is still outstanding
   * after the user adjusts the entry amount.
   */
  entriesForPurchaseOrder(purchaseOrder) {
    return purchaseOrder.materials.map((material) => {
      const entry = this.getFields()

      entry.purchase_order = purchaseOrder.id
      entry.purchase_order_material = material.id
      entry.purchase_order_material_view = material.material_view
      entry.amount = material.amount
      entry.ordered_amount = material.amount

      return entry
    })
  }

  preInsert(purchaseOrderEntry) {
    // check date types
    if (typeof purchaseOrderEntry.entry_date === 'object') {
      purchaseOrderEntry.entry_date = moment(purchaseOrderEntry.entry_date).format('YYYY-MM-DD')
    }

    return purchaseOrderEntry
  }

  preUpdate(purchaseOrderEntry) {
    // check date types
    if (typeof purchaseOrderEntry.entry_date === 'object') {
      purchaseOrderEntry.entry_date = moment(purchaseOrderEntry.entry_date).format('YYYY-MM-DD')
    }

    // The API rejects an explicit null location, so send no key at all.
    if (purchaseOrderEntry.stock_location === null) {
      delete purchaseOrderEntry.stock_location
    }

    return purchaseOrderEntry
  }
}

let purchaseOrderEntryModel = new PurchaseOrderEntry()

export default purchaseOrderEntryModel
