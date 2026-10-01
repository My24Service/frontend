import axios from 'axios'
import BASE_URL from './base-url'
import setInterceptors from '@/services/auth/clientDriver'

const client = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: false
})

setInterceptors(client)

export default client
