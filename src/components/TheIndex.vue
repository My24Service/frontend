<template>
  <div ref="index" v-if="!isLoggedIn">
    <b-container class="d-flex justify-center flex-column">
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
            <b-icon icon="hourglass-split"></b-icon>
          </h3>
        </div>
      </header>

    </div>
  </div>
</template>

<script>
import { componentMixin } from '@/utils.js'
import NavBrand from '@/components/NavBrand.vue'
import LoginForm from '@/components/LoginForm.vue'
import Version from "./Version.vue"

export default {
  name: 'TheIndex',
  mixins: [componentMixin],
  components: {
    NavBrand,
    LoginForm,
    Version
  },
  data() {
    return {
      slide: 0,
      memberInfo: this.$store.state.memberInfo,
    }
  },

  created() {
    setTimeout(() => {
      if (this.isPlanning) {
        console.info(`planning, redirecting to 'order-list'`)
        this.$router.push({ name: 'material-list' });
      }
    }, 100);
  }
}
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
