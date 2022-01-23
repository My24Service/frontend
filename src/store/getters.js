import { isEmpty } from '@/utils';

export const getters = {
  isLoggedIn: state => {
    return !isEmpty(state.userInfo);
  },
  getUserPk: state => {
    return state.userInfo.pk;
  },
  getMemberPk: state => {
    return state.memberInfo.id
  },
  getUserName: state => {
    if (state.userInfo.is_superuser) {
      return 'superuser';
    }

    if (state.userInfo.first_name) {
      return state.userInfo.first_name;
    }

    return state.userInfo.username;
  },
  getMemberLogo(state) {
    return state.memberInfo.companylogo;
  },
  getMemberName(state) {
    return state.memberInfo.name;
  },
};
