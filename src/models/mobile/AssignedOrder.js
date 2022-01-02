import BaseModel from '@/models/base';


class AssignedOrder extends BaseModel {
  fields = {
    "id": null,
    "engineer": null,
    "student_user": null,
    "order": null,
    "started": "",
    "ended": "",
    "rating": null,
    "user_full_name": "",
    "order_name": "",
    "order_city": ""
  }

  url = '/mobile/assignedorder/'
}

let assignedOrderModel = new AssignedOrder()

export default assignedOrderModel
