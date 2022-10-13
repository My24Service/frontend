import BaseModel from '@/models/base';


class WorkHours extends BaseModel {
  url = '/company/user-workhours/list_totals/'

}

let workHoursModel = new WorkHours();

export default workHoursModel;
