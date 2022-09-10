export default (client, auth) => {
  /**
   * Add Authorization header
   */
  client.interceptors.request.use((request) => {
    // for some queries we shouldn't send any headers
    const guestOnlyEndpoints = ['authenticate']
    if (guestOnlyEndpoints.includes(request._endpointKey)) return request

    const token = auth.getAccessToken()
    if (token) {
      request.headers = {
        ...request.headers || {},
        Authorization: `Bearer ${token}`
      }
    }

    return request
  }, error => {
    console.log('in interceptors', error)
    if (error.response.status === 401) {
      console.log('doing logout without reload')
      auth.logout(false)
    }
    Promise.reject(error)
  })
}
