<template>
  <p>
    <span class="header">
      {{ text }}
    </span>
  </p>
</template>

<script>
export default {
  name: "HeaderComponent",
  props: {
    text: {
      type: [String]
    }
  }
}
</script>

<style scoped>
.header {
  font-size: 14px;
  font-weight: bold;
}
</style>
