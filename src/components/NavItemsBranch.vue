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

    <b-nav-item
      :to="{name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.TECHNICAL }}"
      :active="isActive('equipment/technical')"
    >
      <IBiWrenchAdjustableCircleFill v-if="!isActive('equipment/technical')"></IBiWrenchAdjustableCircleFill>
      <IBiWrenchAdjustableCircle v-else></IBiWrenchAdjustableCircle>
      {{ $trans('Technical') }}
    </b-nav-item>

    <b-nav-item
      :to="{name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.FACILITY }}"
      :active="isActive('equipment/facility')"
    >
      <IBiBuildingsFill v-if="!isActive('equipment/facility')"></IBiBuildingsFill>
      <IBiBuildings v-else></IBiBuildings>
      {{ $trans('Facility') }}
    </b-nav-item>

    <b-nav-item :to="{name: 'equipment-location-list'}">
      <IBiGeoAltFill v-if="!isActive('location')"></IBiGeoAltFill>
      <IBiGeoAlt v-else></IBiGeoAlt>
      {{ $trans('Locations') }}
    </b-nav-item>
  </div>
</template>

<script>
import {EQUIPMENT_TYPES} from '@/constants'
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
      EQUIPMENT_TYPES,
      memberService: new MemberService(),
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
}
</script>
<style scoped>
.nav-items {
  flex-grow: 1;
}
</style>
