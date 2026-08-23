import authHeader from './auth-header'
import type { AxiosInstance } from 'axios'

// The auth store is imported lazily, inside the 401 branch, on purpose. A static
// import here closes a cycle: models/base -> services/api -> this module ->
// stores/auth -> stores/main -> utils -> models/orders/Order -> models/base,
// which left BaseModel undefined for any code that entered the graph through a
// model or through services/api. errorHandler is already async and the store is
// only needed at the moment a 401 is handled, so deferring the import costs
// nothing and breaks the cycle at its only edge into the stores.
async function errorHandler(error: any) {
  console.error(`got error: ${error}`)
  if (error.response && error.response.status === 401) {
    console.log('doing logout')
    const {useAuthStore} = await import("@/stores/auth")
    const authStore = useAuthStore()
    authStore.logout();
    document.location.href = "/"
  } else {
    console.log(error)
  }
  return Promise.reject(error)
}

export default (client: AxiosInstance) => {
  /**
   * Add Authorization header
   */
  client.interceptors.request.use(
    request => {
      const header = authHeader()
      request.headers = {
        ...request.headers || {},
        ...header
      } as any

      return request
    },
      error => errorHandler(error)
  )

  client.interceptors.response.use(
response => response,
error => errorHandler(error)
  )
}
