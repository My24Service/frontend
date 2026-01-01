<template>
  <div>
    <h6>{{ $trans("Expiry condition") }}</h6>
    <b-row>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          v-bind:label="$trans('field')"
          label-for="action-condition-field"
        >
          <BFormInput
            id="action-condition-field"
            size="sm"
            v-model="form.num_days_model_field"
            @input="handleInputChange"
          ></BFormInput>
          <b-form-invalid-feedback id="action-condition-value">
            {{ $trans('Please enter a valid field name') }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          v-bind:label="$trans('operator')"
          label-for="action-condition-operator"
        >
          <b-form-select
            v-model="form.num_days_operator"
            :options="operators"
            size="sm"
            @input="handleInputChange"
          ></b-form-select>
        </BFormGroup>
      </b-col>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          v-bind:label="$trans('Number of days')"
          label-for="action-condition-value"
        >
          <BFormInput
            :type="'number'"
            id="action-condition-value"
            size="sm"
            v-model="form.num_days"
            @input="handleInputChange"
          ></BFormInput>
          <b-form-invalid-feedback id="action-condition-value">
            {{ $trans('Please enter a valid integer') }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import { useVuelidate } from "@vuelidate/core";
import { required, integer } from "@vuelidate/validators";

export default {
  setup() {
    return { v$: useVuelidate() };
  },
  validations() {
    return {}
  },
  props: {
    statuscode: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      form: {
        num_days_model_field: null,
        num_days_operator: '<',
        num_days: null
      },
      operators: ['<', '<=', '>', '>='],
    }
  },
  methods: {
    handleInputChange(val) {
      this.$emit('expiry-condition-changed', this.form)
    }
  },
  watch: {
    statuscode (val) {
      if (val.id) {
        Object.assign(this.form, this.statuscode)
      }
    }
  }
};
</script>
<style scoped>
h6 {
  margin-top: 2rem;
}
</style>
