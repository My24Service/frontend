import { createStore } from 'vuex'

import { actions } from './actions';
import { getters } from './getters';
import { mutations } from './mutations';

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
});

export default store;
