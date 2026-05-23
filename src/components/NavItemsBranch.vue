<template>
  <div class="nav-items branch" ref="nav-items" v-if="userInfo.user">
    <b-nav-item :to="{name: 'startpage'}">
      <IBiClockFill v-if="isActive('startpage')"></IBiClockFill>
      <IBiClock v-else></IBiClock>
      {{ $trans('Start') }}
    </b-nav-item>

    <b-nav-item :to="{name: 'orders-schedule'}">
      <IBiBriefcaseFill v-if="isActive('orders')"></IBiBriefcaseFill>
      <IBiBriefcase v-else></IBiBriefcase>
      {{ $trans('Planning') }}
    </b-nav-item>

    <b-nav-item :to="{name: 'equipment-equipment-list'}">
      <IBiWrenchAdjustableCircleFill v-if="!isActive('equipment')"></IBiWrenchAdjustableCircleFill>
      <IBiWrenchAdjustableCircle v-else></IBiWrenchAdjustableCircle>
      {{ $trans('Techniek') }}
    </b-nav-item>

    <b-nav-item :to="{name: 'equipment-location-list'}">
      <IBiBuildingsFill v-if="!isActive('location')"></IBiBuildingsFill>
      <IBiBuildings v-else></IBiBuildings>
      {{ $trans('Facilitair') }}
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
  name: "NavItemsBranch",
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
        return parts[1] === item
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
