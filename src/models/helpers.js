import axios from 'axios';


function usernameExists(username) {
  return new Promise((resolve, reject) => {
    axios.get(`/company/username-exists/?username=${username}`)
      .then((response) => {
        resolve(response.data['available'])
      })
      .catch((error) => {
        reject(error)
      })
  })
}

export { usernameExists }
