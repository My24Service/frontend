import type { AxiosInstance } from 'axios'
import { useAuthToken } from '@/features/auth/token'

async function errorHandler(error: any) {
  console.error(`got error: ${error}`)
  const headers = error.config?.headers
  const sentAuth = typeof headers?.get === 'function'
    ? headers.get('Authorization')
    : headers?.Authorization
  if (error.response && error.response.status === 401 && sentAuth) {
    console.log('doing logout')
    const {useAuthStore} = await import("@/features/auth/store")
    const authStore = useAuthStore()
    authStore.logout();
    document.location.href = "/"
  } else {
    console.log(error)
  }
  return Promise.reject(error)
}

export default (client: AxiosInstance) => {
  client.interceptors.request.use(
    request => {
      const token = useAuthToken().value
      const header = token ? { Authorization: `Bearer ${token}` } : {}
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
