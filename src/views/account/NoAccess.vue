<template>
  <div class='app-page'>
    <h1><IBiLock></IBiLock></h1>

      <div class="panel no-access">
        <div class="text-center" v-if="isLoggedIn">
          <h3>{{ $trans('No access') }}</h3>
          <p>{{ $trans('Your account level may not have permission to access this page.')}}</p>
          <p>{{ $trans('Please contact the administrator.')}}</p>
        </div>
        <div v-else>
          <h3 class="text-center">{{ $trans('Log in') }}</h3>
          <div class="text-left">
            <LoginForm />
          </div>
        </div>
      </div>
</div>
</template>

<script>
import LoginForm from "@/components/LoginForm";
import {$trans} from "@/utils";

export default {
  name: 'NoAccess',
  methods: {$trans},
  components: {
    LoginForm
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
  },
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
    inline-size: max-content;
  }
</style>
