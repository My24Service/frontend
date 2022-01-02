import BaseModel from '@/models/base'


class MemberDeleted extends BaseModel {
  fields = {
    'companycode': '',
    'name': '',
    'address': '',
    'postal': '',
    'city': '',
    'country_code': '',
    'tel': '',
    'fax': '',
    'www': '',
    'email': '',
    'companylogo': '',
    'is_deleted': true
  }

  url = '/member/member-deleted/'

}

let memberDeletedModel = new MemberDeleted()

export default memberDeletedModel
