import AuthService from '@/services/auth2/service';

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
