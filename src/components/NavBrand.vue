<template>
  <b-navbar-brand ref="nav-brand" to="/" :title="memberName" v-if="memberLogo">
    <img class="memberLogo" v-bind:src="memberLogo" v-bind:alt="memberName" >
  </b-navbar-brand>
</template>

<script setup>
import {computed} from "vue";
import {useStore} from "vuex";

const store = useStore()
const memberLogo = computed(() => store.getters.getMemberLogo)
const memberName = computed( () => store.getters.getMemberName)
</script>
<style scoped>
.memberLogo {
  max-width: 200px;
  max-height: 100px
}
</style>

