<template>
  <div id="app">
    <Notification v-if="isLoggedIn" />
    <router-view/>
  </div>
</template>

<script>
import { componentMixin } from '@/utils';
import Notification from '@/components/Notification'

export default {
  name: 'App',
  mixins: [componentMixin],
  components: {
    Notification,
  },
};
</script>

<style>
</style>
