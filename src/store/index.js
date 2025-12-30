import { createStore } from 'vuex'

import { actions } from './actions';
import { getters } from './getters';
import { mutations } from './mutations';
import { auth } from "@/services/auth2/module";

let store = new createStore({
  state: {
    data: [],
    next: null,
    previous: null,
    count: 0,
    num_pages: 0,
    urls: null,
    memberContract: null,
    currentLanguage: null,
    languages: [],
    memberInfo: null,
    userInfo: null,
    statuscodes: [],
    token: undefined,
    unacceptedCount: null,
    streamInfo: null,
    maintenanceEquipment: []
  },
  actions,
  getters,
  mutations,
  modules: {
    auth,
  },
});

export default store;
