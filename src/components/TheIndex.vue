<template>
  <div ref="index" v-if="!store.state.auth.loggedIn">
    <b-container class="d-flex justify-center flex-column" v-if="memberInfo">
      <NavBrand />
      <h4>{{  memberInfo.name }}</h4>
    </b-container>
    <b-container class="d-flex">
      <div class='panel'>
        <LoginForm/>
      </div>
    </b-container>
    <b-container class="d-flex justify-center">
      <Version />
    </b-container>
  </div>
  <div v-else id="app-layout">
    <div class="app-page">
      <header>
        <div class='page-title'>
          <h3>
            <IBiHourglassSplit></IBiHourglassSplit>
          </h3>
        </div>
      </header>

    </div>
  </div>
</template>

<script setup>
import NavBrand from '@/components/NavBrand.vue'
import LoginForm from '@/components/LoginForm.vue'
import Version from "./Version.vue"
import {computed, onMounted} from "vue";
import {useAuthStore} from "@/stores/auth";
import {useMainStore} from "@/stores/main";

const authStore = useAuthStore()
const mainStore = useMainStore()
const memberInfo = computed(() => mainStore.memberInfo)

onMounted(() => {
  setTimeout(() => {
    if (authStore.isPlanning) {
      console.info(`planning, redirecting to 'order-list'`)
      this.$router.push({ name: 'material-list' });
    }
  }, 100);
})
</script>

<style scoped>
.justify-center {
  justify-content: center;
  text-align: center;
  padding: 2rem 0;
  color: var(--text-color, #757a7c);
}
.panel {
  padding: 3vw !important;
}
</style>
