<template>
  <div class="nav-items branch-settings" ref="nav-items" v-if="userInfo.user">
    <b-nav-item
      :to="{name: 'settings-company'}"
      :active="isActive('settings-company')"
    >
      {{ $trans('Company') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-users-planningusers'}"
      :active="isActive('settings-company')"
    >
      {{ $trans('Users') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-order-statuscode-list'}"
      :active="isActive('statuscodes')"
    >
      {{ $trans('Statuses') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-order-filter-list'}"
      :active="isActive('filter')"
    >
      {{ $trans('Filters') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-branches'}"
      :active="isActive('branches')"
    >
      {{ $trans('Branches') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-equipment'}"
      :active="isActive('equipment')"
    >
      {{ $trans('Technology') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'settings-locations'}"
      :active="isActive('locations')"
    >
      {{ $trans('Facilities') }}
    </b-nav-item>

  </div>
</template>

<script>

import SubNav from '@/components/SubNav';
import {MemberService} from "@/models/member/Member";
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
      memberService: new MemberService(),
      requestedCount: null
    }
  },
  methods: {
    isActive(item, subsection) {
      const parts = this.$route.path.split('/')
      if(!subsection) {
        return parts[2] === item
      } else {
        return parts[parts.length] === item
      }
    }
  },
  async created() {
    if (this.showMembers) {
      const result = await this.memberService.getRequestedCount()
      this.requestedCount = result.count
    }
  },
  computed: {
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
  components: {
    SubNav,
  }
}
</script>
<style scoped>
.nav-items {
  flex-grow: 1;
}
</style>
