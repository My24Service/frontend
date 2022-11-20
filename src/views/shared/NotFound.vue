<template>
  <b-row align-h="center">
    <b-col cols="4">
      <div class="no-access">
        <h3>{{ $trans('Page not found') }}</h3>
        <p align="center">{{ $trans('The requested page could not be found') }}</p>
      </div>
    </b-col>
  </b-row>
</template>

<script>
export default {
  name: 'NoAccess',
}
</script>

<style scoped>
  .no-access {
    padding-top: 120px;
    text-align: center;
  }
</style>
