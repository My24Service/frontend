import axios from 'axios'
import BASE_URL, {BASE_URL_RUST} from './base-url'
import auth from '@/services/auth'

let client = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true
})

auth.setInterceptors(client)

let rustClient = axios.create({
  baseURL: `${BASE_URL_RUST}`,
  withCredentials: true
})

auth.setInterceptors(rustClient)

export default client
export {rustClient}
