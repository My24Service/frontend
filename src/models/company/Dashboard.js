import BaseModel from '@/models/base'


class Dashboard extends BaseModel {
  fields = {
  }

  url = '/member/member/get_dashboard/'

}

let dashboardModel = new Dashboard()

export default dashboardModel
