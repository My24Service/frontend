<template>
  <div class="container register">
    <ResetPassword />
  </div>
</template>

<script>
import {SetPasswordForm as ResetPassword} from "@/features/account"

export default {
  components: {
    ResetPassword
  },
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>
<style scoped>
.register {
  padding-top: 68px;
}
</style>
