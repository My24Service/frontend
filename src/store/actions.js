import Vue from 'vue';
import axios from 'axios';

import my24 from '@/services/my24';
import { isEmpty } from '@/utils';

import {
  SET_MEMBER_INFO,
  SET_LANGUAGE,
  SET_USER_INFO,
  SET_TOKEN,
  SET_MEMBER_CONTRACT,
  DATA_LOADED,
  SET_STATUSCODES,
  SET_ASSIGN_ORDERS,
} from './mutation-types';

const setLanguageUrlEl = document.getElementById('set_language_url');
const setLanguageUrl = setLanguageUrlEl ? JSON.parse(setLanguageUrlEl.textContent) : '';

export const actions = {
  setAssignOrders({commit}, orders) {
    commit(SET_ASSIGN_ORDERS, orders);
  },
  getAssignOrders({state}) {
    return new Promise((resolve) => {
      resolve(state.assignOrders);
    });
  },
  initStore({ commit, dispatch }) {
    const currentLanguageEl = document.getElementById('current_language');
    const currentLanguage = currentLanguageEl ? JSON.parse(currentLanguageEl.textContent) : 'en';
    commit(SET_LANGUAGE, currentLanguage);

    return new Promise((resolve, reject) => {
      dispatch('getInitialData')
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        })
    })
  },
  getCsrfToken({ commit }) {
    return new Promise((resolve, reject) => {
      axios.get('/get-csrf-token/')
        .then((response) => {
          commit(SET_TOKEN, response.data.token);
          resolve(response.data.token);
        })
        .catch((error) => {
          console.log('Error getting token');
          reject();
        });
    });
  },
  setLanguage({ commit }, data) {
    return new Promise((resolve) => {
      const config = {
        headers: {
          'X-CSRFToken': data.token,
          'Content-Type': 'multipart/form-data'
        },
      };

      let bodyFormData = new FormData();
      bodyFormData.append('language', data.language);

      axios.post(setLanguageUrl, bodyFormData, config)
        .then((res) => {
          commit(SET_LANGUAGE, data.language);
          resolve();
        });
    });
  },
  logout({ dispatch, state }, token) {
    let loader = Vue.$loading.show()
    const url = '/rest-auth/logout/'
    const config = {
      headers: {
        'X-CSRFToken': token,
      },
    }

    return new Promise((resolve, reject) => {
        axios.post(url, {}, config)
          .then((response) => {
            dispatch('getInitialData')
              .then(() => {
                loader.hide();
                resolve();
              })
              .catch((error) => {
                console.log(error);
                loader.hide();
                reject(error);
              });
          })
          .catch((error) => {
            console.log(error);
            loader.hide();
            reject();
          });
      });
  },
  login({ state, dispatch }, data) {
    let loader = Vue.$loading.show()

    const url = '/rest-auth/login/'
    const config = {
      headers: {
        'X-CSRFToken': data.token,
      },
    }

    const postData = {
      username: data.username,
      password: data.password,
    }

    return new Promise((resolve, reject) => {
        axios.post(url, postData, config)
          .then((response) => {
            dispatch('getInitialData')
              .then((result) => {
                resolve({'allowed': my24.isAllowed(result.userInfo)});
                loader.hide();
              })
              .catch((error) => {
                loader.hide();
                reject(error);
              });
          })
          .catch((error) => {
            loader.hide();
            reject();
          });
      });
  },
  getInitialData({ commit }) {
    return new Promise((resolve, reject) => {
      my24.getInitialData()
        .then((result) => {
          window.member_type_text = result.memberInfo.member_texts;
          const memberContract = !isEmpty(result.userInfo) ? my24.getModelsFromString(result.userInfo.member_contract) : {};
          commit(SET_USER_INFO, result.userInfo);
          commit(SET_MEMBER_INFO, result.memberInfo);
          commit(SET_MEMBER_CONTRACT, memberContract);
          commit(SET_STATUSCODES, result.statuscodes);

          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    })
  },
  dataLoaded({ commit }, data) {
    commit(DATA_LOADED, data);
  },
  hasAccessToRoute({ state }, route) {
    let parts = route.split('/');
    parts.shift();
    const lenParts = parts.length;
    const [mod, part] = parts;

    const result = my24.hasAccessToModule({
      contract: state.memberContract,
      module: mod,
      part,
      lenParts,
      isStaff: state.userInfo.is_staff,
      isSuperuser: state.userInfo.is_superuser
    });

    return new Promise((resolve) => {
      resolve(result);
    })
  },
  status2color({ state }, status) {
    // return new Promise((resolve) => {
      if (!status) {
        console.log('no status');
        return;
      }

      for (let i=0; i<state.statuscodes.length; i++) {
        const statuscode = state.statuscodes[i];
        let color = statuscode.color;

        if (color.substr(0, 1) !== '#') color = '#' + color;

        // first try regex
        const re = new RegExp(statuscode, 'i');
        if (re.test(status)) {
          return color;
          // return resolve(color);
        }

        if (status === statuscode) {
          return color;
          // return resolve(color);
        }
      }
    // resolve('');
    return '';
    // });
  },
  getStatuscodes({ state }) {
    return new Promise((resolve) => {
      resolve(state.statuscodes);
    });
  },
  getCountries({ state }) {
    return new Promise((resolve) => {
      resolve(state.memberInfo.countries);
    });
  },
  getOrderTypes({ state }) {
    return new Promise((resolve) => {
      resolve(state.memberInfo.order_types);
    });
  },
  getMemberType({ state }) {
    return new Promise((resolve) => {
      resolve(state.memberInfo.member_type);
    });
  },
  getIsStaff({ state }) {
    return new Promise((resolve) => {
      resolve(state.userInfo.is_staff);
    });
  },
  getIsSuperuser({ state }) {
    return new Promise((resolve) => {
      resolve(state.userInfo.is_superuser);
    });
  }
};
