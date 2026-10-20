export function useCommon() {
  return {
    get authStore() {
      return useAuthStore()
    },
    get mainStore() {
      return useMainStore()
    },
    get route() {
      return useRoute()
    },
    get router() {
      return useRouter()
    },
    get toast() {
      return useToast().create
    },
    get queryClient() {
      return useQueryClient()
    }
  }
}