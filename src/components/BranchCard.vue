<template>
  <div v-if="branch">
    <h4 class="text-center">{{ branch.name }}</h4>
    <dl>
      <dt>{{  $trans('Address') }}</dt>
      <dd>
        <address>
          {{ branch.address }}, {{ branch.city }} {{  branch.country_code }},
          {{ branch.postal ? branch.postal.toUpperCase() : ''}}
        </address>
      </dd>
      <dt>{{ $trans('Contact') }}</dt>
      <dd>
        {{ branch.contact ?  branch.contact + ' &middot; ' : ''}}
        {{ branch.email || '(email unknown)' }} <br>
        <span v-if="branch.tel">{{ branch.tel }} <br></span>
        <span v-if="branch.mobile">{{ branch.mobile }}</span>
      </dd>

      <dt v-if="branch.remarks">{{ $trans('Remarks') }}</dt>
      <dd v-if="branch.remarks" class="remarks">{{ branch.remarks.trim() }}</dd>
    </dl>
  </div>
</template>

<script>
import componentMixin from "@/mixins/common";

export default {
  name: "BranchCard",
  props: {
    branch: {
      type: Object,
      default: null
    },
  },
  mixins: [componentMixin],
}
</script>

<style scoped>
.remarks {
  white-space: pre;
}
</style>
