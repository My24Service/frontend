import AuthService from '@/services/auth2/service';
import accountModel from "@/models/account/Account";

const storageUser = localStorage.getItem('user')
const user = storageUser ? JSON.parse(storageUser) : null;
const initialState = user
  ? { status: { loggedIn: true }, user }
  : { status: { loggedIn: false }, user: null };

export const auth = {
  namespaced: true,
  state: initialState,
  actions: {
    authenticate({commit}, accessToken) {
      AuthService.authenticate(accessToken);
      commit('loginSuccess', user);
    },
    logout({commit}) {
      AuthService.logout();
      commit('logout');
    },
    loginFailure({commit}) {
      commit('loginFailure');
    },
    refreshToken({commit}) {
      const token = localStorage.getItem('accessToken')
      if (token) {
        accountModel.refreshToken(token).then((result) => {
          console.debug('token refresh result', result)
          AuthService.authenticate({ accessToken: result.token })
          console.debug('token refreshed, reload window')
          window.location.reload()
        })
      } else {
        console.log('no token, logout and reload')
        AuthService.logout()
      }
    }
  },
  mutations: {
    loginSuccess(state, accessToken) {
      state.status.loggedIn = true;
      state.user = user;
    },
    loginFailure(state) {
      state.status.loggedIn = false;
      state.user = null;
    },
    logout(state) {
      state.status.loggedIn = false;
      state.user = null;
    },
  }
};
