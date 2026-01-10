<template>
  <b-navbar-brand ref="nav-brand" to="/" :title="props.memberInfo.name">
    <img
      class="memberLogo"
      :src="props.memberInfo.companylogo_url"
      :alt="props.memberInfo.name"
    >
  </b-navbar-brand>
</template>

<script setup>
const props = defineProps(['memberInfo'])
</script>
<style scoped>
.memberLogo {
  max-width: 200px;
  max-height: 100px
}
</style>

