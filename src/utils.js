import my24 from './services/my24'
import {OrderService} from './models/orders/Order'

// Deep import on purpose: the "@/features/auth" door re-exports LoginForm.vue,
// which pulls bootstrap-vue-next into this module's graph and deadlocks specs
// that mock it through tests/unit/support/form-harness.js.
import {useAuthStore} from "@/features/auth/store";
import {useMainStore} from "@/stores/main";

function isEmpty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

async function doFetchUnacceptedCountAndUpdateStore() {
  const store = useMainStore()
  const service = new OrderService()
  const countResult = await service.getUnacceptedCount()
  if (countResult && 'count' in countResult) {
    store.setUnacceptedCount(countResult.count)
  }
}

function hasAccessToModule(module, part) {
  const authStore = useAuthStore()
  const mainStore = useMainStore()
  return my24.hasAccessToModule({
    isStaff: authStore.isStaff,
    isSuperuser: authStore.isSuperuser,
        modules: mainStore.getModules,
        parts: mainStore.getModuleParts,
    module,
    part,
  })
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

export {
  isEmpty,
  doFetchUnacceptedCountAndUpdateStore,
  hasAccessToModule,
  uuidv4
}
