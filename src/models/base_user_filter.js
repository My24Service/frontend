import BaseModel from './base'

export const QUERY_MODE_AND = 'and'
export const QUERY_MODE_OR = 'or'

export const OPERATOR_MATCHES = 'MATCHES'
export const OPERATOR_ONLY_MATCHES = 'ONLY_MATCHES'
export const OPERATOR_EXCEPT_MATCHES = 'EXCEPT_MATCHES'

export const FIELD_TYPE_CHAR = 'char'
export const FIELD_TYPE_BOOL = 'bool'
export const FIELD_TYPE_DATE = 'date'
export const FIELD_TYPE_DATETIME = 'datetime'

export const BASE_QS_OPTION_ALL = 'all'

class FilterConditionValue {
  char_value
  date_value
  datetime_value
  bool_value

  constructor(obj) {
    switch (obj.type) {
      case FIELD_TYPE_CHAR:
        this.char_value = obj.value
        break
      case FIELD_TYPE_BOOL:
        this.bool_value = obj.value
        break;
      case FIELD_TYPE_DATE:
        this.date_value = obj
        break;
      case FIELD_TYPE_DATETIME:
        this.datetime_value = obj
        break;
      default:
        console.log('FilterConditionValue: Unknown field type', obj)
        throw `FilterConditionValue: Unknown field type: ${obj.type}`
    }
  }
}

class FilterCondition {
  filter
  field
  operator
  values = []
  is_case_sensitive = false
  is_exact = false
  is_exclude = false
  values_query_mode = QUERY_MODE_OR
  values_not = false

  constructor(obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (this.hasOwnProperty(k)) {
        if (k === 'values') {
          this[k] = v.map((value) => new FilterConditionValue(value))
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
  base_qs = BASE_QS_OPTION_ALL
  json_conditions = []
  querymode = QUERY_MODE_OR

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

  getStatuscodesSettings() {
    return this.axios.get(`${this.url}get_statuscodes_settings/`).then((response) => response.data)
  }

  getBaseQsOptions() {
    return this.axios.get(`${this.url}get_base_qs_options/`).then((response) => response.data)
  }
}

export const USER_FILTER_TYPE_ORDER = 'order'
// export const USER_FILTER_TYPE_QUOTATION = 'quotation'

export {BaseUserFilterModel, BaseUserFilterService, FilterCondition, FilterConditionValue}
