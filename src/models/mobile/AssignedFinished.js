import BaseModel from '@/models/base';


class AssignedFinished extends BaseModel {
  url = '/mobile/assignedorder/finished_list/'
}

let assignedFinishedModel = new AssignedFinished();

export default assignedFinishedModel;
