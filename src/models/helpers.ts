import axios from '@/services/api'


function usernameExists(username: string): Promise<boolean> {
  return axios.get(`/company/username-exists/?username=${username}`).then((response) => response.data['available'])
}

export { usernameExists }
