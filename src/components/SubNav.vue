<template>
  <div ref="page-subnav" class="page-subnav">
    <b-nav>
      <b-nav-item
        v-for="item in visibleItems"
        :key="item.label"
        :active="isSubActive(item)"
        :to="resolveTo(item)"
      >
        {{ $trans(item.label) }}
        <b-badge v-if="item.badge === 'requestedCount' && requestedCount > 0" variant="light">{{ requestedCount }}</b-badge>
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>
import { useMainStore } from "@/stores/main";
import componentMixin from "@/mixins/common";
import { SUBNAV_SECTIONS } from "@/components/navSections";
import { useRequestedCount } from "@/components/the_nav/useNav";

// One config-driven subnav for every section. The router registers this
// component for each `app-subnav` outlet with a `section` prop
// (`props: { 'app-subnav': { section: 'orders' } }`); `items` overrides the
// section config item-for-item ({ label, to: { name }, guard? }).
// Active state is by route NAME (each item lists the names it stays active
// on), which replaces the per-file $route.path splits.
export default {
  name: "SubNav",
  mixins: [componentMixin],
  props: {
    section: {
      type: String,
      default: '',
    },
    items: {
      type: Array,
      default: null,
    },
  },
  setup(props) {
    const mainStore = useMainStore()
    const { requestedCount, loadRequestedCount } = useRequestedCount()

    // The members section always fetches the requested-members count for the
    // Requested badge (no role guard around the call itself; the routes are
    // staff-meta guarded).
    if (props.section === 'members') {
      loadRequestedCount()
    }

    return {
      mainStore,
      requestedCount,
    }
  },
  computed: {
    sectionItems() {
      return this.items || SUBNAV_SECTIONS[this.section] || []
    },
    navCtx() {
      // All lazy getters: a section only evaluates the guards it declares,
      // and several store getters read through memberInfo, which callers
      // mounting another section never seed.
      const vm = this
      const mainStore = this.mainStore
      return {
        hasAccessToModule: (module, part) => vm.hasAccessToModule(module, part),
        get isAdmin() { return vm.isAdmin },
        get isPlanning() { return vm.isPlanning },
        get isStaff() { return vm.isStaff },
        get isSuperuser() { return vm.isSuperuser },
        get isCustomer() { return vm.isCustomer },
        get isBranchEmployee() { return vm.isBranchEmployee },
        get hasBranches() { return vm.hasBranches },
        get flavour() { return vm.flavour },
        get memberType() { return mainStore.getMemberType },
      }
    },
    visibleItems() {
      return this.sectionItems.filter((item) => this.isShown(item))
    },
  },
  methods: {
    isShown(item) {
      if (typeof item.show === 'function') {
        return !!item.show(this.navCtx)
      }
      return item.show !== false
    },
    resolveTo(item) {
      if (typeof item.to === 'function') {
        return item.to(this.navCtx)
      }
      return item.to
    },
    isSubActive(item) {
      const names = item.active || (item.to && item.to.name ? [item.to.name] : [])
      return names.includes(this.$route.name)
    },
  },
}
</script>

<style scoped>
</style>
