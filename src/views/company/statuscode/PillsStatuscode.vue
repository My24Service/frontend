<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="isActive(STATUSCODE_TYPE_LEAVE_HOURS)"
        :to="{ name: `company-statuscodes-${STATUSCODE_TYPE_LEAVE_HOURS}` }">
        {{ $trans('Leave') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive(STATUSCODE_TYPE_SICK_LEAVE)"
        :to="{ name: `company-statuscodes-${STATUSCODE_TYPE_SICK_LEAVE}` }">
        {{ $trans('Sick leave') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive(STATUSCODE_TYPE_QUOTATION)"
        :to="{ name: `company-statuscodes-${STATUSCODE_TYPE_QUOTATION}` }">
        {{ $trans('Quotation') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive(STATUSCODE_TYPE_INVOICE)"
        :to="{ name: `company-statuscodes-${STATUSCODE_TYPE_INVOICE}` }">
        {{ $trans('Invoice') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>
import { componentMixin } from '@/utils'
import {
  STATUSCODE_TYPE_LEAVE_HOURS,
  STATUSCODE_TYPE_QUOTATION,
  STATUSCODE_TYPE_SICK_LEAVE,
  STATUSCODE_TYPE_INVOICE
} from "@/models/company/AbstractStatuscode";

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
      STATUSCODE_TYPE_INVOICE
    }
  },
  async created() {
  },
  methods: {
    isActive(item) {
      return this.$route.path.includes(item) || this.$route.path === '/company/statuscodes' && item === STATUSCODE_TYPE_LEAVE_HOURS
    }
  },
}
</script>
