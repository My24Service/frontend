import BaseModel from "../base";

class AbstractActionModel {
  name
  address
  subject
  type = 'email'
  destination
  conditions
  description
  template
  company_partner
  json_conditions = []
  querymode = 'or'
  statuscode
  override_status = false
}

class ActionService extends BaseModel {
  url = '/statuscode/action/'
}

export default AbstractActionModel
export { ActionService }
