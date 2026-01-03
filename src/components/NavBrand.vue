<template>
  <b-navbar-brand ref="nav-brand" to="/" :title="memberName" v-if="memberLogo">
    <img class="memberLogo" v-bind:src="memberLogo" v-bind:alt="memberName" >
  </b-navbar-brand>
</template>

<script setup>
import {computed} from "vue";
import {useMainStore} from "@/stores/main";

const store = useMainStore()
const memberLogo = computed(() => store.getMemberLogo)
const memberName = computed( () => store.getMemberName)
</script>
<style scoped>
.memberLogo {
  max-width: 200px;
  max-height: 100px
}
</style>

