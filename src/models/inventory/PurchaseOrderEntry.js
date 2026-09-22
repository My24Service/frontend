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

  /**
   * The body of the bulk endpoint: a bare list of entries, one object per row.
   *
   * The endpoint creates every row in one atomic request, so a row the user
   * removed before saving is simply not in the list - there is nothing to
   * delete, and a failure leaves nothing half-created behind to retry around.
   *
   * Only the keys `PurchaseOrderEntryRequest` declares are sent, carrying the
   * two conversions the form's inputs need: `amount` arrives as a string from a
   * text input where the request declares a number, and `entry_date` arrives as
   * a Date from the picker where the request declares an ISO date - preInsert's
   * rule, applied to a copy so a failed save leaves the picker's Date alone.
   */
  requestRows(entries) {
    return entries.map((staged) => {
      const entry = this.preInsert({ ...staged })

      return {
        purchase_order: entry.purchase_order,
        purchase_order_material: entry.purchase_order_material,
        amount: Number(entry.amount),
        entry_date: entry.entry_date,
        stock_location: entry.stock_location,
      }
    })
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
