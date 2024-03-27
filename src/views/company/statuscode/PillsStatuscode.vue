<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="isActive('quotation')"
        :to="{ name: 'company-statuscodes-quotation' }">
        {{ $trans('Quotation') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('order')"
        :to="{ name: 'company-statuscodes-quotation' }">
        {{ $trans('Order') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>
import { componentMixin } from '@/utils.js'

export default {
  name: 'PillsStatuscode',
  mixins: [componentMixin],
  data() {
    return {
      isLoaded: false,
      memberType: null,
      hasApiUsers: false,
    }
  },
  async created() {
    // check api users
    this.hasApiUsers = await this.$store.getters.getMemberHasApiUsers

    // get member type
    this.memberType = await this.$store.dispatch('getMemberType')

    this.isLoaded = true
  },
  methods: {
    hasCustomers() {
      return this.hasAccessToModule('company', 'customer-users')
    },
    isActive(item) {
      return this.$route.path.includes(item)
    }
  },
}
</script>
