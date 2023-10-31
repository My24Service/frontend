<template>
  <div class="app-page">
    <h1><b-icon icon="cone-striped"></b-icon></h1>
    <div class="panel no-access">
      <h3>{{ $trans('Page not found') }}</h3>
      <p align="center">{{ $trans('The requested page could not be found') }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
}
</script>

<style scoped>
h1 {
  color: #fffc;
  text-align: center;
  padding-block: 3rem 1rem;
  font-size: 4rem;
}
.no-access {
    padding: 3rem!important;
    text-align: center;
    margin: -1rem auto 3rem!important;
    max-width: 60ch;
  }
</style>
