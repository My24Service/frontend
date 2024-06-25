import {BaseUserFilter, BaseUserFilterService} from "../base_user_filter";

class OrderFilter extends BaseUserFilter {
}

class OrderFilterService extends BaseUserFilterService {
  url = '/order/filter/'
}

export {OrderFilter, OrderFilterService}
