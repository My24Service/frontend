<template>
  <div class="space" v-if="hasNav">
    <b-nav tabs>
      <b-nav-item
        :active="$route.name === 'company-time-registration'"
        :to="{ name: 'company-time-registration' }">
        {{ $trans('Time registration') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('requests')"
        :to="{ name: 'leave-requests' }">
        {{ $trans('Leave requests') }}
      </b-nav-item>
      <b-nav-item
        :active="$route.name === 'leave-list'"
        :to="{ name: 'leave-list' }">
        {{ $trans('Leave') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('types')"
        :to="{ name: 'leave-types' }">
        {{ $trans('Leave types') }}
      </b-nav-item>
      <b-nav-item
        :active="$route.name === 'sick-leave-list'"
        :to="{ name: 'sick-leave-list' }">
        {{ $trans('Sick leave') }}
      </b-nav-item>
      <b-nav-item
        :active="$route.name === 'unconfirmed-sick-leave'"
        :to="{ name: 'unconfirmed-sick-leave' }">
        {{ $trans('Unconfirmed sick leave') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>
import { componentMixin } from '@/utils.js'

export default {
  name: 'SubNav',
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
  computed: {
    hasNav() {
      const has = ['demo', 'viavandalen']
      return has.indexOf(this.$store.getters.getMemberCompanycode);
    },
  }
}
</script>
<style scoped>
.space {
  padding-bottom: 10px;
}
</style>
