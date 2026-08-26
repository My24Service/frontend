<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3><IBiBasket></IBiBasket>{{ $trans("Webshop") }}</h3>
      </div>
    </header>
    <div class='page-detail'>
      <div class='panel'>
        <iframe ref="iframe" src=""></iframe>
      </div>
    </div>
  </div>
</template>

<style scoped>
iframe {
  background-color: #0001;
  width: 100%;
  min-height: 65vh;
  border: none;
}
</style>

<script>
export default {
  name: 'WebshopIframe',
  mounted() {
    this.$refs['iframe'].src = "https://shltr-group.com/product/trailerstand-plus/"
  }
}
</script>
