import authHeader from './auth-header'

async function errorHandler(error) {
  console.error(`got error: ${error}`)
  if (error.response.status === 401) {
    console.log('doing logout with reload and redirect to home')
    const store = useStore();
    if (!store) {
      console.warn("no store, return")
      // document.location.href = "/"
      return
    }
    await store.logout();
    // auth.logout(false, true, true)
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
