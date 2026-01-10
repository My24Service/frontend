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
// import {MemberService} from "@/models/member/Member";

export default {
  name: 'WebshopIframe',
  data() {
    return {
      // service: new MemberService()
    }
  },
  mounted() {
    // const result = await this.service.getOCIUrl()
    this.$refs['iframe'].src = "https://shltr-group.com/product/trailerstand-plus/"
  }
}
</script>
