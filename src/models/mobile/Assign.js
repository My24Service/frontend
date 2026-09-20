// TEMPORARY SHIM — do not extend.
//
// Assignment belongs to the field-service Slice now
// (`src/features/field-service/assignment/`). This file survives only for the
// one caller that has not moved yet:
//
//   src/views/company/EngineerEventOrderForm.vue  — `assignToUser` once, from
//   the engineer-event screens (phase 2 of the field-service Slice)
//
// It goes through the generated client rather than restating the request, so a
// backend rename fails here at import time instead of quietly sending nothing.
// `unAssign` is gone with its last caller: nothing imports it any more.
//
// Delete this file when the engineer-event screens convert.
import {mobileAssignUserCreate} from '@/api/sdk.gen'

class AssignService {
  /**
   * Assign orders to a user. `order_ids` are the orders' own `order_id`, which
   * is what `AssignUserView` looks them up by; `notify_user` adds the query
   * parameter that sends the engineer a websocket message per order.
   */
  async assignToUser(user_id, order_ids, notify_user) {
    return mobileAssignUserCreate({
      path: {id: user_id},
      body: {order_ids: order_ids.join(',')},
      ...(notify_user ? {query: {notify_user: '1'}} : {}),
    }).then((response) => response.data)
  }
}

export default new AssignService()
export { AssignService }
