import moment from 'moment'
import BaseModel from '@/models/base'

let tomorrow = moment().add(1, 'days')

// sunday
if (tomorrow.day() === 0) {
  tomorrow = tomorrow.add(1, 'days')
}

// saturday
if (tomorrow.day() === 6) {
  tomorrow = tomorrow.add(2, 'days')
}


class PurchaseOrder extends BaseModel {
  fields = {
    'purchase_order_id': null,
    'order_name': '',
    'order_address': '',
    'order_postal': '',
    'order_city': '',
    'order_country_code': 'NL',
    'supplier_reservation': null,

    'supplier': null,

    'order_reference': '',
    'order_tel': '',
    'order_mobile': '',
    'order_email': '',
    'order_contact': '',

    'expected_entry_date': tomorrow.toDate(),

    'supplier_remarks': '',
    'description': '',

    'statusses': [],
    'purchase_order_materials': [],
    'purchase_order_materials_detail_view': [],
    'entries': []
  }

  url = '/inventory/purchaseorder/'

  postCopyFields(fields) {
    fields.expected_entry_date = tomorrow.toDate()
    return fields
  }

  preInsert(purchaseOrder) {
    // check date types
    if (typeof purchaseOrder.expected_entry_date === 'object') {
      purchaseOrder.expected_entry_date = moment(purchaseOrder.expected_entry_date).format('YYYY-MM-DD')
    }

    return purchaseOrder
  }

  preUpdate(purchaseOrder) {
    // check date types
    if (typeof purchaseOrder.expected_entry_date === 'object') {
      purchaseOrder.expected_entry_date = moment(purchaseOrder.expected_entry_date).format('YYYY-MM-DD')
    }

    return purchaseOrder
  }

}

let purchaseOrderModel = new PurchaseOrder()

export default purchaseOrderModel
