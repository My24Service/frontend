let BASE_URL = document.location.origin
let BASE_URL_RUST = document.location.origin

if (document.location.protocol === 'http:') {
  BASE_URL = document.location.origin.replace('3000', '8000')
  BASE_URL_RUST = document.location.origin.replace('3000', '8080')
}

export default BASE_URL
export {BASE_URL_RUST}
