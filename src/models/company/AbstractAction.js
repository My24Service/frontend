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

export default AbstractActionModel
