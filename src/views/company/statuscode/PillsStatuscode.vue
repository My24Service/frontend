<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="isActive('quotation')"
        :to="{ name: 'company-statuscodes-quotation' }">
        {{ $trans('Quotation') }}
      </b-nav-item>
      <b-nav-item
        v-show="false"
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
      memberType: null,
      hasApiUsers: false,
    }
  },
  async created() {
  },
  methods: {
    isActive(item) {
      return this.$route.path.includes(item)
    }
  },
}
</script>
