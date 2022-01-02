<template>
  <div>
    <span v-for="item in data" :key="item.order_id">
      <span class="order-status-img" v-bind:style="{ backgroundColor: item.color }">
        <img width="12" src="/static/core/img/pixel.png" />
      </span>
    </span>
  </div>
</template>

<script>
export default {
  name: 'OrderStatusColorSpan',
  props: {
    data: {
      type: [Array]
    }
  }
};
</script>

<style scoped>
.order-status-img {
  margin-right: 2px;
}
</style>
