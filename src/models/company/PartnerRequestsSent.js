import BaseModel from '@/models/base'


class PartnerRequestsSent extends BaseModel {
  fields = {
    'from_member': null,
    'from_member_view': {},
    'to_member': null,
    'to_member_view': {},
    'status': '',
    'created': '',
    'modified': ''
  }

  url = '/company/partner-request/'

  getListUrl() {
    return '/company/partner-request/sent/'
  }
}

let partnerRequestsSentModel = new PartnerRequestsSent()

export default partnerRequestsSentModel
