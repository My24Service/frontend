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
    <VueDatePicker
      v-model="time"
      :placeholder="$trans('Set time')"
      time-picker
      arrow-navigation
      :formats="{ input: 'HH:mm' }"
    >
      <template #trigger>
        <p class="clock-icon">
          <IBiClock></IBiClock>
        </p>
      </template>
    </VueDatePicker>
  </div>
</template>
<script>
import componentMixin from "@/mixins/common";

export default {
  name: "TimeInput",
  emits: ['timeChanged'],
  props: {
    timeIn: {
      type: String
    }
  },
  mixins: [componentMixin],
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
  },
  created() {
    this.time = this.cleanTime(this.timeIn)
    console.log(this.time, this.timeIn)
  }
}
</script>
<style scoped>
.time-input {
  width: 100px !important;
  float:left !important;
}
</style>
