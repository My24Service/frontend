<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="isActive('quotations')"
        :to="{ name: 'quotation-list' }">
        {{ $trans('Definitive') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('preliminary')"
        :to="{ name: 'preliminary-quotations' }">
        {{ $trans('Preliminary') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('sent')"
        :to="{ name: 'quotations-sent' }">
        {{ $trans('Sent') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>
import { componentMixin } from '../utils.js'

export default {
  mixins: [componentMixin],
  data() {
    return {}
  },
  async created() {
  },
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
}
</script>
