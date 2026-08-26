<template>
  <div class="nav-items branch-settings" ref="nav-items" v-if="userInfo.user">
    <b-nav-item
      v-if="!isBranchEmployee"
      :to="{name: 'settings-company'}"
      :active="isActive('settings-company')"
    >
      {{ $trans('Company') }}
    </b-nav-item>

    <b-nav-item
      v-if="!isBranchEmployee"
      :to="{ name: 'settings-company-import-list' }"
      :active="isActive('import')">
      {{ $trans('Import') }}
    </b-nav-item>

    <b-nav-item
      :to="usersRoute"
      :active="isActive('users')"
    >
      {{ $trans('Users') }}
    </b-nav-item>

    <b-nav-item
      v-if="!isBranchEmployee"
      :to="{name: 'settings-order-statuscode-list'}"
      :active="isActive('statuscodes')"
    >
      {{ $trans('Statuses') }}
    </b-nav-item>

    <b-nav-item
      v-if="!isBranchEmployee"
      :to="{name: 'settings-order-filter-list'}"
      :active="isActive('filter')"
    >
      {{ $trans('Filters') }}
    </b-nav-item>

    <b-nav-item
      v-if="!isBranchEmployee"
      :to="{name: 'settings-branches'}"
      :active="isActive('branches')"
    >
      {{ $trans('Branches') }}
    </b-nav-item>

    <b-nav-item
      v-if="isBranchEmployee"
      :to="{name: 'settings-my-branch'}"
      :active="isActive('branches/form/my')"
    >
      {{ $trans('My branch') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-equipment-list', params: {type: EQUIPMENT_TYPES.TECHNICAL}}"
      :active="isActive('equipment/technical')"
    >
      {{ $trans('Technical') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-equipment-list', params: {type: EQUIPMENT_TYPES.FACILITY}}"
      :active="isActive('equipment/facility')"
    >
      {{ $trans('Facility') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-location-list'}"
      :active="isActive('locations')"
    >
      {{ $trans('Locations') }}
    </b-nav-item>

  </div>
</template>

<script>
import {EQUIPMENT_TYPES} from '@/constants'
import {memberMemberRequestedCountRetrieve} from "@/api/sdk.gen";
import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";
import {computed} from "vue";
import {useAuthStore} from "@/stores/auth";

export default {
  name: "NavItemsSettings",
  mixins: [componentMixin],
  setup() {
    const mainStore = useMainStore()
    const authStore = useAuthStore()
    const userInfo = computed(() => authStore.userInfo);
    return {
      mainStore,
      userInfo
    }
  },
  data() {
    return {
      EQUIPMENT_TYPES,
      requestedCount: null
    }
  },
  methods: {
    isActive(item) {
      return this.$route.path.indexOf(item) !== -1
    }
  },
  async created() {
    if (this.showMembers) {
  // Direct call into the generated client - #326 deleted the hand-written
  // Member service this used to ride on. throwOnError keeps the catch
  // below working the way it did.
      const {data} = await memberMemberRequestedCountRetrieve({throwOnError: true})
      this.requestedCount = data.count
    }
  },
  computed: {
    usersRoute() {
      // A branch employee only manages the employee users of their own branch.
      return this.isBranchEmployee
        ? {name: 'settings-users-employees'}
        : {name: 'settings-users-planningusers'}
    },
    showMembers() {
      return this.hasMembers;
    },
    hasMembers() {
      return this.isAdmin
    },
    unacceptedCount() {
      return this.mainStore.unacceptedCount
    }
  },
  watch: {
  },
}
</script>
<style scoped>
.nav-items {
  flex-grow: 1;
}
</style>
