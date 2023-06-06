# my24frontend

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Icons

delete
```<b-icon-trash></b-icon-trash>```

search
```<b-icon-search></b-icon-search>```

plus
```<b-icon-plus></b-icon-plus>```

edit
```<b-icon-pencil></b-icon-pencil>```

document
```<b-icon-file></b-icon-file>```

download
```<b-icon-download></b-icon-download>```

refresh
```<b-icon-arrow-repeat></b-icon-arrow-repeat>```

### Local development

#### API base URL

Export default `https://demo.api.my24service-dev.com` in `src/services/base-url.js`, uncomment the rest:

```
// let BASE_URL = document.location.origin
//
// const DJANGO_PORT = 8000
// const RUST_PORT = 8080
//
// if (document.location.protocol === 'http:') {
//   BASE_URL = document.location.origin.replace('3000', DJANGO_PORT)
// }

export default 'https://demo.api.my24service-dev.com'
```

#### Hosts entry

Add `/etc/hosts` entry:

```
127.0.0.1           demo.my24service-dev.com
```

When running `npm run dev` you should now be able to connect to `http://demo.my24service-dev.com:3000` which should use the development API at `demo.api.my24service-dev.com`.
