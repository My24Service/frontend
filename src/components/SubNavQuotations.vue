<template>
  <div>
    <b-nav-item
      :active="isActive('quotations')"
      v-if="isStaff || isSuperuser || isPlanning"
      :to="{ name: 'quotation-list' }">
      {{ $trans('Quotations') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('preliminary')"
      v-if="isStaff || isSuperuser || isPlanning"
      :to="{ name: 'preliminary-quotations' }">
      {{ $trans('Preliminary') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('sent')"
      v-if="isStaff || isSuperuser || isPlanning"
      :to="{ name: 'quotations-sent' }">
      {{ $trans('Sent') }}
    </b-nav-item>
  </div>
</template>

<script>


export default {

  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[parts.length - 1] === item
    }
  },
  computed: {
    hasMembers() {
      return this.$store.getters.getIsSuperuser || this.$store.getters.getIsStaff
    },
    hasDeletedMembers() {
      return this.$store.getters.getIsSuperuser || this.$store.getters.getIsStaff
    },
    hasContracts() {
      return this.$store.getters.getIsSuperuser || this.$store.getters.getIsStaff
    },
    hasModules() {
      return this.$store.getters.getIsSuperuser
    },
    hasModuleParts() {
      return this.$store.getters.getIsSuperuser
    },
  },
}
</script>
