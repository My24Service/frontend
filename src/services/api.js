import axios from 'axios'
import BASE_URL from './base-url'
import auth from '@/services/auth'

let client, normalClient

if (process.env.NODE_ENV !== 'test') {
  client = axios.create({
    baseURL: `${BASE_URL}/api`,
    withCredentials: false
  })
  normalClient = axios.create({
    withCredentials: false
  })
  auth.setInterceptors(client)
} else {
  client = axios
}

export default client
export {normalClient}
