<template>
  <div>
    <b-nav-item
      :active="isActive('quotations')"
      v-if="isStaff || isSuperuser || isPlanning"
      :to="{ name: 'quotation-list' }">
      {{ $trans('Quotations') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('preliminary-quotations')"
      v-if="isStaff || isSuperuser || isPlanning"
      :to="{ name: 'preliminary-quotations' }">
      {{ $trans('Preliminary') }}
    </b-nav-item>
  </div>
</template>

<script>
import { componentMixin } from '@/utils'

export default {
  mixins: [componentMixin],
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[parts.length - 1] === item
    }
  },
  computed: {
    hasMembers() {
      return this.isSuperuser || this.isStaff
    },
    hasDeletedMembers() {
      return this.isSuperuser || this.isStaff
    },
    hasContracts() {
      return this.isSuperuser || this.isStaff
    },
    hasModules() {
      return this.isSuperuser
    },
    hasModuleParts() {
      return this.isSuperuser
    },
  },
}
</script>
