<template>
  <div ref="app-layout">
    <TheNav />
    <router-view/>
    <div class="container main-app-container">
      <SubNav v-if="hasSubNav">
        <router-view name="app-subnav"></router-view>
      </SubNav>
      <router-view :key="$route.fullPath" name="app-content"></router-view>
    </div>
  </div>
</template>

<script>
import TheNav from './TheNav';
import SubNav from './SubNav';


export default {
  props: {
    hasSubNav: {
      type: Boolean,
      default: true
    }
  },
  components: {
    TheNav,
    SubNav
  },
}
</script>

<style scoped>
</style>
