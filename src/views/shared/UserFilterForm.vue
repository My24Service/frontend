<template>
  <div class="app-page" v-if="!isLoading && filter">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="filter-square"></b-icon>
          <span v-if="isCreate">{{ $trans('New filter') }}</span>
          <span v-else>{{ $trans('Edit fitler') }}</span>
        </h3>
        <div class="flex-columns">
          <b-button @click="cancelForm" type="button" variant="secondary outline">
            {{ $trans('Cancel') }}</b-button>
          <b-button @click="submitForm" type="button" variant="primary">
            {{ $trans('Save') }}</b-button>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <div class='flex-columns'>
        <div class='panel col-1-2'>
          <b-form-group
            label-cols="3"
            label-size="sm"
            :label="$trans('Name')"
            label-for="filter_name"
          >
            <b-form-input
              id="filter_name"
              size="sm"
              v-model="filter.name"
              :state="isSubmitClicked ? !v$.filter.name.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.filter.name.$error : null">
              {{ $trans('Please enter a name') }}
            </b-form-invalid-feedback>
          </b-form-group>

          <b-form-group
            label-cols="3"
            label-size="sm"
            :label="$trans('Query mode')"
            label-for="filter_querymode"
          >
            <b-form-select
              id="filter_query_mode"
              v-model="filter.querymode"
              :options="queryModes"
              size="sm"></b-form-select>
          </b-form-group>

          <h6>{{ $trans("Conditions")}}</h6>
          <div
            class="condition-container rounded"
            v-for="(condition, index) in filter.json_conditions"
            :key="index"
          >
            <b-container>
              <b-row>
                <b-col cols="6">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Field')"
                    label-for="filter_field"
                  >
                    <b-form-select
                      id="filter_field"
                      v-model="condition.field"
                      :options="allFields"
                      @change="checkCondition(condition)"
                      size="sm"></b-form-select>
                  </b-form-group>
                </b-col>
                <b-col cols="6">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Operator')"
                    label-for="filter_operator"
                  >
                    <b-form-select
                      id="filter_operator"
                      v-model="condition.operator"
                      :options="getOperators(condition.field)"
                      size="sm"
                      @change="checkCondition(condition)"
                    ></b-form-select>
                  </b-form-group>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="3">
                  <b-form-group
                    label-size="sm"
                    :label="$trans('Case sensitive')"
                    label-for="filter_is_case_sensitive"
                  >
                    <b-form-checkbox
                      id="filter_is_case_sensitive"
                      :disabled="isCaseDisabled"
                      v-model="condition.is_case_sensitive"
                    ></b-form-checkbox>
                  </b-form-group>
                </b-col>
                <b-col cols="2">
                  <b-form-group
                    label-size="sm"
                    :label="$trans('Exact')"
                    label-for="filter_is_exact"
                  >
                    <b-form-checkbox
                        id="filter_is_exact"
                        :disabled="isExactDisabled"
                        v-model="condition.is_exact"
                      >
                      </b-form-checkbox>
                  </b-form-group>
                </b-col>
                <b-col cols="2">
                  <b-form-group
                    label-size="sm"
                    :label="$trans('Exclude')"
                    label-for="filter_is_exclude"
                  >
                    <b-form-checkbox
                      id="filter_is_exclude"
                      :disabled="isExcludeDisabled"
                      v-model="condition.is_exclude"
                    >
                    </b-form-checkbox>
                  </b-form-group>
                </b-col>
                <b-col cols="2">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Values')"
                    label-for="filter_values_query_mode"
                  >
                    <b-form-select
                      :disabled="valuesQueryModeDisabled"
                      id="filter_values_query_mode"
                      v-model="condition.values_query_mode"
                      :options="queryModes"
                      size="sm"></b-form-select>
                  </b-form-group>
                </b-col>
                <b-col cols="3">
                  <b-form-group
                    label-size="sm"
                    :label="$trans('Values NOT')"
                    label-for="filter_values_not"
                  >
                    <b-form-checkbox
                      id="filter_values_not"
                      :disabled="isValuesNotDisabled"
                      v-model="condition.values_not"
                    >
                    </b-form-checkbox>
                  </b-form-group>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12">
                  <b-form-group
                    label-size="sm"
                    v-bind:label="$trans('Values')"
                    label-for="filter_operator"
                  >
                    <div v-for="(_, index) in condition.values" :key="index" class="flex-columns value-container">
                      <b-form-input
                        v-if="condition.fieldInputType === FIELD_TYPE_CHAR"
                        id="filter_name"
                        size="sm"
                        v-model="condition.values[index].char_value"
                      ></b-form-input>
                      <b-form-checkbox
                        v-if="condition.fieldInputType === FIELD_TYPE_BOOL"
                        id="filter_values_not"
                        v-model="condition.values[index].bool_value"
                      ></b-form-checkbox>
                      <b-link :title="$trans('delete')" @click="removeConditionValue(condition, index)">
                        <b-icon-trash-fill class="edit-icon"></b-icon-trash-fill>
                      </b-link>
                      <br/>
                    </div>
                    <div class="float-right add-value">
                      <b-link
                        :title="$trans('add value')"
                        @click="addConditionValue(condition)"
                      >
                        {{ $trans("add value") }}
                      </b-link>
                    </div>
                  </b-form-group>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12">
                  <div class="h5 left">
                    <b-link
                      :title="$trans('remove condition')"
                      @click="removeCondition(index)"
                    >
                      {{ $trans("remove condition") }}
                    </b-link>
                  </div>
                </b-col>
              </b-row>
            </b-container>
          </div>
          <b-container>
            <b-row>
              <b-col cols="12">
                <hr/>
                <div class="h4 float-right">
                  <b-link
                    :title="$trans('add condition')"
                    @click="addCondition()"
                  >
                    {{ $trans("add condition") }}
                  </b-link>
                </div>
              </b-col>
            </b-row>
          </b-container>
        </div>
        <div class='panel col-1-2'>
          <h5>{{ $trans("Examples")}}</h5>
          <ul>
            <li
              v-for="(example, index) in examples"
              :key="index"
            >
              <h6>{{ example.name }}</h6>
              <p>{{ example.description }}</p>
              <p>
                <b-link
                  :title="$trans('load example')"
                  @click="loadExample(example)"
                >
                  {{ $trans("load example") }}
                </b-link>
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {useVuelidate} from '@vuelidate/core'
import {required} from '@vuelidate/validators'

import {
  FIELD_TYPE_BOOL,
  FIELD_TYPE_CHAR, FIELD_TYPE_DATE, FIELD_TYPE_DATETIME,
  FilterCondition, FilterConditionValue,
  OPERATOR_EXCEPT_MATCHES, OPERATOR_ONLY_MATCHES,
  QUERY_MODE_AND,
  QUERY_MODE_OR,
  USER_FILTER_TYPE_ORDER
} from "../../models/base_user_filter";
import {OrderFilterModel, OrderFilterService} from "../../models/orders/OrderFilter";

/*
  TODO
   - field types inputs
   - when last_status is selected, provide example values of cleaned up statuses from settings
   - somehow let the user choose what queryset to use (current orders, past orders, all orders)
 */
export default {
  name: "UserFilterForm",
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      filter: {
        name: {
          required,
        },
      }
    }
  },
  props: {
    type: {
      type: [String],
      default: null
    },
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,
      submitClicked: false,
      service: null,
      model: null,
      filter: null,
      examples: [],
      queryModes: [
        {value: QUERY_MODE_AND, text: this.$trans('and')},
        {value: QUERY_MODE_OR, text: this.$trans('or')},
      ],
      allFields: [],
      fieldsConfig: null,
      operators: {},
      valuesQueryModeDisabled: false,
      isExcludeDisabled: false,
      isValuesNotDisabled: false,
      isExactDisabled: false,
      isCaseDisabled: false,
      nonTextFieldTypes: {},
      fieldInputType: FIELD_TYPE_CHAR,
      FIELD_TYPE_CHAR,
      FIELD_TYPE_BOOL
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
  },
  async created() {
    this.isLoading = true
    if (this.type === USER_FILTER_TYPE_ORDER) {
      this.service = new OrderFilterService()
      this.model = OrderFilterModel
    }

    // allowed filter fields, displaying normal and related in one list for now
    this.fieldsConfig = await this.service.getFields()
    this.allFields = [...this.fieldsConfig.model, ...this.fieldsConfig.related]
    // TODO display right input for field types
    this.nonTextFieldTypes = await this.service.getNonTextFieldTypes()

    // operators that are supported
    this.operators = await this.service.getOperators()

    if (this.isCreate) {
      this.examples = await this.service.getExamples()
      this.filter = new this.model({json_conditions: [this.newCondition()]})
      this.checkCondition(this.filter.json_conditions[0])
      console.log(this.filter)
    } else {
      await this.loadData()
    }
    this.isLoading = false
  },
  methods: {
    getOperators(field) {
      if (this.fieldsConfig.model.indexOf(field) !== -1) {
        return this.operators.model
      }

      if (this.fieldsConfig.related.indexOf(field) !== -1) {
        return this.operators.related
      }

      return []
    },
    checkCondition(condition) {
      // model field or related?
      if (this.fieldsConfig.model.indexOf(condition.field) !== -1) {
        condition.values_query_mode = QUERY_MODE_OR
        this.isExcludeDisabled = false
        this.isValuesNotDisabled = false
        this.valuesQueryModeDisabled = true
      } else {
        // ONLY_MATCHES has is_exclude and values_not set to true
        // EXCEPT_MATCHES has is_exclude set to false and values_not set to true
        if (condition.operator === OPERATOR_ONLY_MATCHES) {
          condition.is_exclude = true
          condition.values_not = true
          condition.values_query_mode = QUERY_MODE_AND
          this.isExcludeDisabled = true
          this.isValuesNotDisabled = true
          this.valuesQueryModeDisabled = true
        }

        else if (condition.operator === OPERATOR_EXCEPT_MATCHES) {
          condition.is_exclude = false
          condition.values_not = true
          condition.values_query_mode = QUERY_MODE_AND
          this.isExcludeDisabled = true
          this.isValuesNotDisabled = true
          this.valuesQueryModeDisabled = true
        }
      }

      // input type
      if (this.nonTextFieldTypes.hasOwnProperty(condition.field)) {
        switch (this.nonTextFieldTypes[condition.field]) {
          case FIELD_TYPE_BOOL:
            condition.fieldInputType = FIELD_TYPE_BOOL;
            this.isExactDisabled = true
            this.isCaseDisabled = true
            break;
          case FIELD_TYPE_DATE:
            condition.fieldInputType = FIELD_TYPE_DATE;
            this.isExactDisabled = true
            this.isCaseDisabled = true
            break;
          default:
            throw `checkCondition: Unknown field type: ${condition.field}`
        }
      } else {
        condition.fieldInputType = FIELD_TYPE_CHAR;
        this.isExactDisabled = false
        this.isCaseDisabled = false
      }
    },
    loadExample(example) {
      this.filter = new this.model({
        name: example.name,
        json_conditions: example.json_conditions,
        querymode: example.querymode
      })
      this.checkCondition(this.filter.json_conditions[0])
    },
    addConditionValue(condition) {
      let value
      switch(this.fieldInputType) {
        case FIELD_TYPE_CHAR:
          value = {
            type: FIELD_TYPE_CHAR,
            value: ''
          }
          break
        case FIELD_TYPE_BOOL:
          value = {
            type: FIELD_TYPE_BOOL,
            value: true
          }
          break;
        case FIELD_TYPE_DATE:
          value = {
            type: FIELD_TYPE_DATE,
            value: new Date()
          }
          break;
        case FIELD_TYPE_DATETIME:
          value = {
            type: FIELD_TYPE_DATETIME,
            value: new Date()
          }
          break;
        default:
          value = {
            type: FIELD_TYPE_CHAR,
            value: ''
          }
          break
      }
      condition.values.push(value)
    },
    removeConditionValue(condition, index) {
      condition.values.splice(index, 1)
      if (condition.values.length === 0) {
        this.addConditionValue(condition)
      }
    },
    removeCondition(index) {
      if (confirm(this.$trans("Remove this condition?"))) {
        this.filter.json_conditions.splice(index, 1)
        if (this.filter.json_conditions.length === 0) {
          this.addCondition()
        }
      }
    },
    newCondition() {
      let condition = new FilterCondition({
        field: this.allFields[0],
      })
      this.addConditionValue(condition)
      return condition
    },
    addCondition() {
      this.filter.json_conditions.push(this.newCondition())
    },
    // API
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          await this.service.insert(this.filter)
          this.infoToast(this.$trans('Created'), this.$trans('Filter has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating filter', error)
          this.errorToast(this.$trans('Error creating filter'))
          this.isLoading = false
        }

        return
      }

      try {
        await this.service.update(this.pk, this.filter)
        this.infoToast(this.$trans('Updated'), this.$trans('Filter has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating filter', error)
        this.errorToast(this.$trans('Error updating filter'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.service.detail(this.pk)
        this.filter = new this.model(data)

        this.isLoading = false
      } catch(error) {
        console.log('error fetching filter', error)
        this.errorToast(this.$trans('Error loading filter'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
div.add-value {
  margin-right: 52px;
}
div.value-container {
  padding-bottom: 4px;
}
div.condition-container {
  background: lightgray;
  margin-bottom: 8px;
}
</style>
