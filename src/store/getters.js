import { isEmpty } from '@/utils'

export const getters = {
  getStreamInfo: state => {
    return state.streamInfo
  },
  isLoggedIn: state => {
    return !isEmpty(state.userInfo)
  },
  getUserPk: state => {
    return state.userInfo.pk
  },
  getUserUUID: state => {
    return state.userInfo.uuid
  },
  getMemberPk: state => {
    return state.memberInfo.id
  },
  getMemberHasApiUsers: state => {
    return state.memberInfo.has_api_users
  },
  getUserName: state => {
    if (state.userInfo.is_superuser) {
      return 'superuser'
    }

    if (state.userInfo.first_name) {
      return state.userInfo.first_name
    }

    return state.userInfo.username
  },
  getMemberLogo(state) {
    return state.memberInfo.companylogo
  },
  getMemberName(state) {
    return state.memberInfo.name
  },
  getMemberCompanycode(state) {
    return state.memberInfo.companycode
  },
  getCurrentLanguage(state) {
    return state.currentLanguage
  },
  getLanguages(state) {
    return state.languages
  },
}
