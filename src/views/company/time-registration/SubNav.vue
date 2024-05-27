<template>
  <div class="space">
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
        :active="$route.name === 'unseen-sick-leave'"
        :to="{ name: 'unseen-sick-leave' }">
        {{ $trans('Unseen sick leave') }}
      </b-nav-item>
      <b-nav-item
        :active="$route.name === 'sick-leave-list'"
        :to="{ name: 'sick-leave-list' }">
        {{ $trans('Sick leave') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>
import { componentMixin } from '@/utils.js'

export default {
  name: 'PillsLeave',
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
<style scoped>
.space {
  padding-bottom: 10px;
}
</style>
