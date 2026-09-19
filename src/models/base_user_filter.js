import BaseModel from './base'

export const QUERY_MODE = {
  AND: 'and',
  OR: 'or',
}

export const OPERATOR = {
  MATCHES: 'MATCHES',
  ONLY_MATCHES: 'ONLY_MATCHES',
  EXCEPT_MATCHES: 'EXCEPT_MATCHES',
}

export const FIELD_TYPE = {
  CHAR: 'char',
  BOOL: 'bool',
  DATE: 'date',
  DATETIME: 'datetime',
}

export const BASE_FILTER_OPTION = {
  ALL: 'all',
}

class FilterConditionValue {
  char_value
  date_value
  datetime_value
  bool_value

  constructor(obj) {
    switch (obj.type) {
      case FIELD_TYPE.CHAR:
        this.char_value = obj.value
        break
      case FIELD_TYPE.BOOL:
        this.bool_value = obj.value
        break;
      case FIELD_TYPE.DATE:
        this.date_value = obj
        break;
      case FIELD_TYPE.DATETIME:
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
  values_query_mode = QUERY_MODE.OR
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
  base_filter = BASE_FILTER_OPTION.ALL
  json_conditions = []
  querymode = QUERY_MODE.OR

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

  getStatuses() {
    return this.axios.get(`${this.url}get_statuses/`).then((response) => response.data)
  }

  getStatusFields() {
    return this.axios.get(`${this.url}get_status_fields/`).then((response) => response.data)
  }

  getBaseFilterOptions() {
    return this.axios.get(`${this.url}get_base_filter_options/`).then((response) => response.data)
  }
}

export const USER_FILTER_TYPE = {
  ORDER: 'order',
  // QUOTATION: 'quotation',
}

export {BaseUserFilterModel, BaseUserFilterService, FilterCondition, FilterConditionValue}
