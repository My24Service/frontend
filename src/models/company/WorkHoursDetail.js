import BaseModel from '@/models/base';


class WorkHoursDetail extends BaseModel {
  url = '/company/user-workhours/'
}

let workHoursDetailModel = new WorkHoursDetail();

export default workHoursDetailModel;
