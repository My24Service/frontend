import type { AxiosInstance, AxiosRequestHeaders } from 'axios'
import { useAuthToken } from '@/features/auth/token'

/**
 * The piece of an axios rejection this driver reads: the response status and
 * the request headers the failing call went out with. Structural on purpose -
 * the request interceptor below replaces `headers` with a plain object, so it
 * is read through both the AxiosHeaders `.get` and the plain property.
 */
interface InterceptorError {
  response?: { status?: number }
  config?: {
    headers?: Record<string, string | undefined> & { get?: (name: string) => string | undefined }
  }
}

async function errorHandler(error: InterceptorError) {
  console.error('got error:', error)
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
  return Promise.reject(error instanceof Error ? error : new Error('Request failed', { cause: error }))
}

export default (client: AxiosInstance) => {
  client.interceptors.request.use(
    request => {
      const token = useAuthToken().value
      const header = token ? { Authorization: `Bearer ${token}` } : {}
      // A plain bag, not an AxiosHeaders instance: axios normalises either on
      // the way out, and the 401 handler below reads the plain property back.
      request.headers = {
        ...request.headers || {},
        ...header
      } as AxiosRequestHeaders

      return request
    },
      error => errorHandler(error)
  )

  client.interceptors.response.use(
    response => response,
    error => errorHandler(error)
  )
}
