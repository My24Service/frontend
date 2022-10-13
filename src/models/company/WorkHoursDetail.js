import BaseModel from '@/models/base';


class TimeSheetDetail extends BaseModel {
  url = '/mobile/assignedorder/list_timesheet_user/'
}

let timeSheetDetailModel = new TimeSheetDetail();

export default timeSheetDetailModel;
