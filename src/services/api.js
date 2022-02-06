import axios from 'axios'
import BASE_URL from './base-url'

const client = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true
})

export default client
