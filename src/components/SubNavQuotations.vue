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
