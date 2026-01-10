<template>
  <div
  >
    <BFormInput
      v-model="time"
      type="text"
      placeholder="HH:mm"
      class="time-input"
      @input="update"
    ></BFormInput>
    <span style="float:left !important;"></span>
    <b-form-timepicker
      button-only
      v-model="time"
      right
      locale="en"
      :placeholder="$trans('Set time')"
      :hour12=false
      @input="update"
    ></b-form-timepicker>
  </div>
</template>
<script>
export default {
  name: "TimeComponent",
  emits: ['timeChanged'],
  data() {
    return {
      time: null
    }
  },
  methods: {
    update(val) {
      if (val.indexOf(':') === -1) {
        return
      }
      this.time = this.cleanTime(val)
      this.$emit('timeChanged', this.time)
    },
    cleanTime(time) {
      if (time.indexOf(':') === -1) {
        return
      }
      const p = time.split(':')
      return `${p[0]}:${p[1]}`
    },
  }
}
</script>
<style scoped>
.time-input {
  width: 100px !important;
  float:left !important;
}
</style>
