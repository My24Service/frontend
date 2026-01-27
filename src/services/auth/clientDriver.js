import authHeader from './auth-header'
import {useAuthStore} from "@/stores/auth";

async function errorHandler(error) {
  console.error(`got error: ${error}`)
  if (error.response.status === 401) {
    console.log('doing logout')
    const authStore = useAuthStore()
    authStore.logout();
    document.location.href = "/"
  } else {
    console.log(error)
  }
  return Promise.reject(error)
}

export default (client) => {
  /**
   * Add Authorization header
   */
  client.interceptors.request.use(
    request => {
      const header = authHeader()
      request.headers = {
        ...request.headers || {},
        ...header
      }

      return request
    },
      error => errorHandler(error)
  )

  client.interceptors.response.use(
response => response,
error => errorHandler(error)
  )
}
