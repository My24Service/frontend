import BaseModel from '@/models/base';


class TimeSheet extends BaseModel {
  url = '/mobile/assignedorder/list_timesheet_totals/'
}

let timeSheetModel = new TimeSheet();

export default timeSheetModel;
