<template>
  <div>
    <b-nav>
      <b-nav-item
        :active="isActive('members')"
        v-if="hasMembers"
        :to="{ name: 'member-list' }">
        {{ $trans('Active') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('requested-members')"
        v-if="hasRequestedMembers"
        :to="{ name: 'member-requested-list' }">
        {{ $trans('Requested') }}
        <b-badge v-if="requestedCount > 0" variant="light">{{ requestedCount }}</b-badge>
      </b-nav-item><b-nav-item
        :active="isActive('deleted-members')"
        v-if="hasDeletedMembers"
        :to="{ name: 'member-deleted-list' }">
        {{ $trans('Deleted') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('contracts')"
        v-if="hasContracts"
        :to="{ name: 'contract-list' }">
        {{ $trans('Contracts') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('modules')"
        v-if="hasModules"
        :to="{ name: 'module-list' }">
        {{ $trans('Modules') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('module-parts')"
        v-if="hasModuleParts"
        :to="{ name: 'module-part-list' }">
        {{ $trans('Module parts') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>
import { componentMixin } from '@/utils'
import {MemberService} from "@/models/member/Member";

export default {
  mixins: [componentMixin],
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
  data() {
    return {
      memberService: new MemberService(),
      requestedCount: null
    }
  },
  async created() {
    const result = await this.memberService.getRequestedCount()
    this.requestedCount = result.count
  },
  computed: {
    hasMembers() {
      return this.isSuperuser || this.isStaff
    },
    hasDeletedMembers() {
      return this.isSuperuser || this.isStaff
    },
    hasRequestedMembers() {
      return this.isSuperuser || this.isStaff
    },
    hasContracts() {
      return this.isSuperuser || this.isStaff
    },
    hasModules() {
      return this.isSuperuser
    },
    hasModuleParts() {
      return this.isSuperuser
    },
  },
}
</script>

<style scoped>
</style>
