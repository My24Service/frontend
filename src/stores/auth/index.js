// Shim beside the legacy callers. It dies when the last importer of
// @/stores/auth retargets to @/features/auth (account slice done, ~15
// component/store/router call sites to go).
export { useAuthStore } from '@/features/auth/store'
