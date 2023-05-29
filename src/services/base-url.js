let BASE_URL = document.location.origin

const DJANGO_PORT = 8000
const RUST_PORT = 8080

if (document.location.protocol === 'http:') {
  BASE_URL = document.location.origin.replace('3000', DJANGO_PORT)
}

export default BASE_URL
