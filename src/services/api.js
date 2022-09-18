import axios from 'axios'
import BASE_URL from './base-url'
import auth from '@/services/auth'

let client = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true
})

auth.setInterceptors(client)

export default client
