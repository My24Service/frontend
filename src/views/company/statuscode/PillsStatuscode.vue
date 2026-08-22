<template>
  <div>
    <b-nav pills>
      <b-nav-item
        v-if="!hasBranches"
        :active="isActive(STATUSCODE_TYPE_ORDER)"
        :to="{ name: getNavLink(STATUSCODE_TYPE_ORDER) }">
        {{ $trans('Orders') }}
      </b-nav-item>
      <b-nav-item
        v-if="!hasBranches"
        :active="isActive(STATUSCODE_TYPE_LEAVE_HOURS)"
        :to="{ name: getNavLink(STATUSCODE_TYPE_LEAVE_HOURS) }">
        {{ $trans('Leave') }}
      </b-nav-item>
      <b-nav-item
        v-if="!hasBranches"
        :active="isActive(STATUSCODE_TYPE_SICK_LEAVE)"
        :to="{ name: getNavLink(STATUSCODE_TYPE_SICK_LEAVE) }">
        {{ $trans('Sick leave') }}
      </b-nav-item>
      <b-nav-item
        v-if="!hasBranches"
        :active="isActive(STATUSCODE_TYPE_QUOTATION)"
        :to="{ name: getNavLink(STATUSCODE_TYPE_QUOTATION) }">
        {{ $trans('Quotation') }}
      </b-nav-item>
      <b-nav-item
        v-if="!hasBranches"
        :active="isActive(STATUSCODE_TYPE_INVOICE)"
        :to="{ name: getNavLink(STATUSCODE_TYPE_INVOICE) }">
        {{ $trans('Invoice') }}
      </b-nav-item>
      <b-nav-item
        v-if="!hasBranches"
        :active="isActive(STATUSCODE_TYPE_WORK_HOURS)"
        :to="{ name: getNavLink(STATUSCODE_TYPE_WORK_HOURS) }">
        {{ $trans('Work hours') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>

import {
  STATUSCODE_TYPE_ORDER,
  STATUSCODE_TYPE_LEAVE_HOURS,
  STATUSCODE_TYPE_QUOTATION,
  STATUSCODE_TYPE_SICK_LEAVE,
  STATUSCODE_TYPE_INVOICE,
  STATUSCODE_TYPE_WORK_HOURS
} from "@/models/company/AbstractStatuscode";
import {$trans} from "@/utils.js";
import componentMixin from "@/mixins/common.js";

export default {
  name: 'PillsStatuscode',
  mixins: [componentMixin],
  data() {
    return {
      memberType: null,
      hasApiUsers: false,
      STATUSCODE_TYPE_LEAVE_HOURS,
      STATUSCODE_TYPE_QUOTATION,
      STATUSCODE_TYPE_SICK_LEAVE,
      STATUSCODE_TYPE_INVOICE,
      STATUSCODE_TYPE_WORK_HOURS,
      STATUSCODE_TYPE_ORDER
    }
  },
  async created() {
  },
  methods: {
    $trans,
    isActive(item) {
      return this.$route.path.includes(item) || this.$route.path === '/company/statuscodes' && item === STATUSCODE_TYPE_ORDER
    },
    getNavLink(type) {
      if (this.hasBranches) {
        return `settings-${type}-statuscode-list`
      }

      return `company-statuscodes-${STATUSCODE_TYPE_ORDER}`
    }
  },
}
</script>
