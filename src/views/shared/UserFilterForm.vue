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

          <h6>{{ $trans("Conditions")}}</h6>
          <b-container v-for="(condition, index) in filter.json_conditions" :key="index">
            <b-row>
              <b-col cols="4">
                <b-form-group
                  label-size="sm"
                  :label="$trans('Case sensitive')"
                  label-for="filter_is_case_sensitive"
                >
                  <b-form-checkbox
                    id="filter_is_case_sensitive"
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
                    v-model="condition.is_exclude"
                  >
                  </b-form-checkbox>
                </b-form-group>
              </b-col>
              <b-col cols="3">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Values query mode')"
                  label-for="filter_values_query_mode"
                >
                  <b-form-select
                    id="filter_values_query_mode"
                    v-model="condition.values_query_mode"
                    :options="valuesQueryModes"
                    size="sm"></b-form-select>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Field')"
                  label-for="filter_field"
                >
                  <b-form-select
                    id="filter_field"
                    v-model="condition.field"
                    :options="fields"
                    size="sm"></b-form-select>
                </b-form-group>
              </b-col>
              <b-col cols="4">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Operator')"
                  label-for="filter_operator"
                >
                  <b-form-select
                    id="filter_operator"
                    v-model="condition.operator"
                    :options="operators"
                    size="sm"></b-form-select>
                </b-form-group>
              </b-col>
              <b-col cols="4">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Values')"
                  label-for="filter_operator"
                >
                  <div v-for="(_, index) in condition.values" :key="index" class="flex-columns value-container">
                    <b-form-input
                      id="filter_name"
                      size="sm"
                      v-model="condition.values[index]"
                    ></b-form-input>
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

          </b-container>
        </div>
        <div class='panel col-1-2'>
          <h6>HOI</h6>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import {
  FilterCondition,
  QUERY_MODE_AND, QUERY_MODE_OR,
  USER_FILTER_TYPE_ORDER
} from "../../models/base_user_filter";
import {OrderFilterModel, OrderFilterService} from "../../models/orders/OrderFilter";

// condition:
// checkboxes for booleans
// is_case_sensitive = false
// is_exact = false
// is_exclude = false
// values_query_mode = QUERY_MODE_OR
// | field | operator | list | value | [add value]
// component for this?

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
      valuesQueryModes: [
        {value: QUERY_MODE_AND, text: this.$trans('and')},
        {value: QUERY_MODE_OR, text: this.$trans('or')},
      ],
      fields: [],
      operators: []
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

    const fieldsConfig = await this.service.getFields()

    this.fields = [...fieldsConfig.model, ...fieldsConfig.related]
    this.operators = await this.service.getOperators()

    if (this.isCreate) {
      const examplesData = await this.service.getExamples()
      this.examples = examplesData.map((example) => new this.model(example))
      this.filter = new this.model({json_conditions: [this.newCondition()]})
      console.log(this.filter)
    } else {
      await this.loadData()
    }
    this.isLoading = false
  },
  methods: {
    addConditionValue(condition) {
      condition.values.push('')
    },
    removeConditionValue(condition, index) {
      condition.values.splice(index, 1)
      if (condition.values.length === 0) {
        condition.values.push('')
      }
    },
    newCondition() {
      return new FilterCondition({values: ['']})
    },
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
</style>
