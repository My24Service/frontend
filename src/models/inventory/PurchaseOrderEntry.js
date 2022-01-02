import moment from 'moment'
import BaseModel from '@/models/base'


class PurchaseOrderEntry extends BaseModel {
  fields = {
    'purchase_order': null,
    'purchase_order_material': null,
    'purchase_order_material_view': {
      'purchase_order_view': {}
    },
    'amount': 0,
    'entry_amount': 0,
    'entry_date': moment().toDate(),
    'stock_location': null
  }

  url = '/inventory/purchaseorder-entry/'

  postCopyFields(fields) {
    fields.entry_date = moment().toDate()
    return fields
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

    return purchaseOrderEntry
  }
}

let purchaseOrderEntryModel = new PurchaseOrderEntry()

export default purchaseOrderEntryModel
