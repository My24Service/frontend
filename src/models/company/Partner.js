import BaseModel from '@/models/base'


class Partner extends BaseModel {
  fields = {
    'partner': 0,
    'partner_view': {},
    'active': true,
    'member_data': [],
  }

  url = '/company/partner/'

}

let partnerModel = new Partner()

export default partnerModel
