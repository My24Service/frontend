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

    'statuses': [],
    'materials': [],
    'entries': [],
    'reservation_materials': []
  }

  url = '/inventory/purchaseorder/'

  postCopyFields(fields) {
    fields.expected_entry_date = tomorrow.toDate()
    return fields
  }

  /**
   * Copy a supplier's details onto an order.
   *
   * An order keeps its own copy of the supplier's address and contact details
   * rather than pointing at the supplier record, so that it still reflects
   * where the goods were actually ordered from if the supplier later moves.
   * Filling those in is a rule about purchase orders, not about any one form.
   */
  applySupplier(purchaseOrder, supplier) {
    purchaseOrder.supplier = supplier.id
    purchaseOrder.order_name = supplier.name
    purchaseOrder.order_address = supplier.address
    purchaseOrder.order_city = supplier.city
    purchaseOrder.order_postal = supplier.postal
    purchaseOrder.order_country_code = supplier.country_code
    purchaseOrder.order_tel = supplier.tel
    purchaseOrder.order_mobile = supplier.mobile
    purchaseOrder.order_email = supplier.email
    purchaseOrder.order_contact = supplier.contact
    purchaseOrder.supplier_remarks = supplier.remarks

    return purchaseOrder
  }

  /**
   * Turn a detail response into the shape the form works with.
   *
   * The API sends expected_entry_date as DD/MM/YYYY; the rest of the app - the
   * date picker, and preInsert/preUpdate on the way back out - works with a
   * Date. This is the inbound half of that conversion.
   */
  async detail(pk) {
    const purchaseOrder = await super.detail(pk)

    purchaseOrder.expected_entry_date = moment(
      purchaseOrder.expected_entry_date, 'DD/MM/YYYY'
    ).toDate()

    return purchaseOrder
  }

  preInsert(purchaseOrder) {
    // A new order has no id yet; the server assigns it.
    delete purchaseOrder.purchase_order_id

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
