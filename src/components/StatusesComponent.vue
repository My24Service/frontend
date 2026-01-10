<template>
<div>
  <h6>
    <IBiBarChartSteps></IBiBarChartSteps>
    {{ $trans('Timeline') }}
  </h6>

  <ul class="listing full-size" style="max-height: 75vh; overflow: auto;">
    <li v-for="status in statuses.slice().reverse()" :key="status.id">
      <div class="listing-item">
        <small>{{ status.status }}</small>
        <small class="dimmed">{{ status.created }}</small>
      </div>
    </li>
  </ul>
</div>
</template>
<script>
export default {
  name: "StatusesComponent",
  props: {
    statuses: {
      type: [Array],
      default: null
    },
  }
}
</script>

<style scoped>

</style>
