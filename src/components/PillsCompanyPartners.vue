<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="isActive('active')"
        :to="{ name: 'company-partners-active' }">
        {{ $trans('Active') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('requests-sent')"
        :to="{ name: 'company-partners-requests-sent' }">
        {{ $trans('Requests sent') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('requests-received')"
        :to="{ name: 'company-partners-requests-received' }">
        {{ $trans('Requests received') }}
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
