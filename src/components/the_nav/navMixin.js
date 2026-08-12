import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";
import {useAuthStore} from "@/stores/auth";

// Shared by NavDefault and NavShltr. Everything either sidebar needs to render;
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
