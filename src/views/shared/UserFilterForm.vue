<template>

</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import {FilterCondition, USER_FILTER_TYPE_ORDER} from "../../models/base_user_filter";
import {OrderFilterModel, OrderFilterService} from "../../models/orders/OrderFilter";

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
      filter: null
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
    if (this.type === USER_FILTER_TYPE_ORDER) {
      this.service = new OrderFilterService()
      this.model = OrderFilterModel
    }
    if (this.isCreate) {
      this.filter = new this.model({})
    } else {
      await this.loadData()
    }
  },
  methods: {
    newCondition() {
      return new FilterCondition({})
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

</style>
