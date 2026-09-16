import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";
// The store directly, not the `@/features/auth` barrel: the barrel re-exports
// LoginForm.vue and TokenRefresh.vue, so a state-only mixin importing it drags
// the component graph (and bootstrap-vue-next) in behind it.
import {useAuthStore} from "@/features/auth/store";

// Everything TheSidebar needs to render;
// the modals it opens (logout / language / password) live in TheNavLoggedIn and
// are reached by id through the v-b-modal directive.
//
// Note: no setup() here on purpose. Vue 3 does not merge setup() from mixins —
// it has to be spread by hand, as equipment_view/equipmentViewMixin.js does —
// so these read the stores from computed properties instead, like componentMixin.
export default {
  props: {
    onlySettings: Boolean
  },
  mixins: [componentMixin],
  computed: {
    memberInfo() {
      return useMainStore().memberInfo
    },
    userInfo() {
      return useAuthStore().userInfo
    },
    getUsername() {
      return useAuthStore().getUserName
    },
    settingsRoute() {
      // Branch employees have no access to /settings/company, so send them to
      // the first settings page they may actually open.
      return this.isBranchEmployee
        ? {name: 'settings-my-branch'}
        : {name: 'settings-company'}
    }
  }
}
