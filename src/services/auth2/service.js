class AuthService {
  authenticate ({ accessToken }) {
    localStorage.setItem('accessToken', accessToken)
  }

  logout() {
    localStorage.removeItem('accessToken')
  }
}

export default new AuthService();
