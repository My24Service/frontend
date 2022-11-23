<template>
  <div>
    <span v-for="item in data" :key="item.order_id">
      <span class="order-status-img" v-bind:style="{ backgroundColor: item.color }">
        <img width="12" :src="PIXEL_URL"  alt="pixel"/>
      </span>
    </span>
  </div>
</template>

<script>
import {PIXEL_URL} from "../constants";

export default {
  name: 'OrderStatusColorSpan',
  props: {
    data: {
      type: [Array],
    }
  },
  data() {
    return {
      PIXEL_URL
    }
  }
};
</script>

<style scoped>
.order-status-img {
  margin-right: 2px;
}
</style>
