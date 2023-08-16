<template>
    <div class="app-page">
      <h1><b-icon icon="truck"></b-icon></h1>
      <div class="panel coming-soon">
        <h3>{{ $trans('Coming Soon') }}</h3>
        <p align="center">{{ $trans('This section of the app is under construction') }}</p>
      </div>
    </div>
</template>

<script>
export default {
  name: 'ComingSoon',
}
</script>

<style scoped>
h1 {
  color: #eceef8;
  text-align: center;
  padding-block: 3rem 1rem;
  font-size: 5rem;
}
.coming-soon {
    padding: 3rem!important;
    text-align: center;
    margin: 3rem auto!important;
    max-width: 60ch;
  }
</style>
