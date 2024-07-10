import {BaseUserFilterModel, BaseUserFilterService} from "../base_user_filter";

class OrderFilterModel extends BaseUserFilterModel {
}

class OrderFilterService extends BaseUserFilterService {
  url = '/order/filter/'
}

export {OrderFilterModel, OrderFilterService}
