<template>
  <p class="flex">
    <b-input-group
      size="sm"
    >
      <BFormInput
        v-model="hours"
        class="input-number"
        size="sm"
        @blur="update"
        :state="v$.hours.$error ? false : null"
      ></BFormInput>

      <template #append>
        <BFormInput
          v-model="minutes"
          class="input-decimal"
          size="sm"
          :state="v$.minutes.$error ? false : null"
          @blur="update"
        ></BFormInput>
      </template>
    </b-input-group>
  </p>
</template>
<script>
import { useVuelidate } from '@vuelidate/core'
import { required, numeric } from '@vuelidate/validators'

export default {
  name: "DurationInput",
  props: ['value'],
  emits: ['durationChanged'],
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      hours: {
        required,
        numeric
      },
      minutes: {
        required,
        numeric
      },
    }
  },
  data() {
    return {
      hours: null,
      minutes: null
    }
  },
  computed: {
    isInValid() {
      return this.v$.$invalid
    }
  },
  watch: {
    value(val) {
      this.setAmount(val)
    }
  },
  methods: {
    setAmount(duration) {
      const parts = duration.split(':')
      this.hours = parts[0]
      this.minutes = parts[1]
    },
    update() {
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      const amount = parseInt(`${this.hours}${this.minutes}`)
      if (isNaN(amount)) {
        throw `invalid input: ${this.hours}:${this.minutes}`
      }

      this.$emit('durationChanged', `${this.hours}:${this.minutes}:00`)
    }
  },
  created() {
    this.setAmount(this.value)
  }
}
</script>

<style scoped>
.input-number {
  width: 40px !important;
  text-align: right;
}
.input-decimal {
  width: 36px !important;
  text-align: center;
}
.flex {
  display : flex;
  margin-top: auto;
}
</style>
