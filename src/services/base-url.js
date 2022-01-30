let BASE_URL = document.location.origin

if (document.location.protocol === 'http:') {
  BASE_URL = document.location.origin.replace('8080', '8000')
}

export default BASE_URL
