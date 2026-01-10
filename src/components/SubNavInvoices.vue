<template>
  <div>
    <b-nav-item
      :active="isActive('invoices')"
      v-if="isStaff || isSuperuser || isPlanning"
      :to="{ name: 'invoice-list' }">
      {{ $trans('Invoices') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('preliminary')"
      v-if="isStaff || isSuperuser || isPlanning"
      :to="{ name: 'preliminary-invoices' }">
      {{ $trans('Preliminary') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('sent')"
      v-if="isStaff || isSuperuser || isPlanning"
      :to="{ name: 'invoices-sent' }">
      {{ $trans('Sent') }}
    </b-nav-item>
  </div>
</template>
<script>
import componentMixin from "@/mixins/common";

export default {
  mixins: [componentMixin],
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[parts.length - 1] === item
    }
  },
}
</script>
