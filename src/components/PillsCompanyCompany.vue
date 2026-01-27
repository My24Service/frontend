<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="isActive('info')"
        :to="{ name: 'company-info' }">
        {{ $trans('Info') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('settings')"
        :to="{ name: 'company-settings' }">
        {{ $trans('Settings') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>


export default {

  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[3] === item
    }
  },
}
</script>

<style scoped>
</style>
