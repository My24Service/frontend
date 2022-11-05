function errorHandler(error, auth) {
  if (error.response.status === 401) {
    console.log('doing logout with reload and redirect to home')
    auth.logout(false, true, true)
  } else {
    console.log(error)
  }
  Promise.reject(error)
}

export default (client, auth) => {
  /**
   * Add Authorization header
   */
  client.interceptors.request.use(
    request => {
        const token = auth.getAccessToken()
        if (token) {
          request.headers = {
            ...request.headers || {},
            Authorization: `Bearer ${token}`
          }
        }

        return request
      },
      error => errorHandler(error)
  )

  client.interceptors.response.use(
response => response,
error => errorHandler(error, auth)
  )
}
