import BaseModel from '@/models/base'


// KPI widgets for the dashboard overview page. Sits next to Dashboard.js so
// the two dashboard models stay together, even though both point at
// /member/member/.
//
// The endpoint only returns what you ask for, so callers set the widget list
// (and any thresholds) through setListArgs before calling list().
class DashboardStats extends BaseModel {
  fields = {
  }

  url = '/member/member/overview_stats/'

}

let dashboardStatsModel = new DashboardStats()

export default dashboardStatsModel
