import BaseModel from './base'

export const QUERY_MODE_AND = 'and'
export const QUERY_MODE_OR = 'or'

export const OPERATOR_MATCHES = 'MATCHES'
export const OPERATOR_ONLY_MATCHES = 'ONLY_MATCHES'
export const OPERATOR_EXCEPT_MATCHES = 'EXCEPT_MATCHES'

export const FIELD_TYPE_BOOL = 'bool'
export const FIELD_TYPE_DATE = 'date'
export const FIELD_TYPE_DATETIME = 'datetime'

class FilterCondition {
  filter
  field
  operator
  values
  is_case_sensitive = false
  is_exact = false
  is_exclude = false
  values_query_mode = QUERY_MODE_OR
  values_not = false

  constructor(obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (this.hasOwnProperty(k)) {
        this[k] = v
      }
    }
  }
}

class FilterExample {
  name
  description
  json_conditions

  constructor(obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (this.hasOwnProperty(k)) {
        if (k === 'json_conditions') {
          this[k] = v.map((condition) => new FilterCondition(condition))
        } else {
          this[k] = v
        }
      }
    }
  }
}

class BaseUserFilterModel {
  id
  name
  json_conditions = []
  querymode

  constructor(obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (this.hasOwnProperty(k)) {
        if (k === 'json_conditions') {
          this[k] = v.map((condition) => new FilterCondition(condition))
        } else {
          this[k] = v
        }
      }
    }
  }
}

class BaseUserFilterService extends BaseModel {
  model = BaseUserFilterModel

  getFields() {
    return this.axios.get(`${this.url}get_fields/`).then((response) => response.data)
  }

  getOperators() {
    return this.axios.get(`${this.url}get_operators/`).then((response) => response.data)
  }

  getQueryModeOptions() {
    return this.axios.get(`${this.url}get_query_mode_options/`).then((response) => response.data)
  }

  getSimpleList() {
    // we could make separate calls to get the orders count of the filters
    return this.axios.get(`${this.url}simple_list/`).then((response) => response.data)
  }

  getNonTextFieldTypes() {
    return this.axios.get(`${this.url}get_non_text_field_types/`).then((response) => response.data)

  }

  getExamples() {
    return this.axios.get(`${this.url}get_examples/`).then((response) => response.data)
  }
}

export const USER_FILTER_TYPE_ORDER = 'order'
// export const USER_FILTER_TYPE_QUOTATION = 'quotation'

export {BaseUserFilterModel, BaseUserFilterService, FilterCondition, FilterExample}
