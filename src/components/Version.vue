<template>
  <span class="version" @click="openReloadModal">
    <span :title="message">{{ version }}
      <small v-if="newVersionAvailable">
        <b>&nbsp;&nbsp;{{ $trans('update available') }}</b>
      </small>
    </span>

    <b-modal
      id="reload-modal"
      ref="reload-modal"
      v-bind:title="$trans('Reload page?')"
      @ok="doReload"
      ok-only
    >
      <p class="my-4">
        {{ $trans(message) }}: {{ newVersion }}
      </p>
      <p class="my-4">
        {{ $trans('Do you want to reload the page?') }}
      </p>
    </b-modal>
  </span>
</template>

<script>
import { VERSION } from '@/version.js'
import axios from '@/services/api.js'

export default {
  name: "appVersion",
  data() {
    return {
      version: VERSION,
      newVersionAvailable: false,
      newVersion: null,
      intervalId: null,
      message: `Using the latest version (${VERSION})`
    }
  },
  methods: {
    async checkVersion() {
      // https://api.github.com/My24Service/frontend/releases
      // const data = await axios.get('https://api.github.com/repos/OWNER/REPO/tags').then((response) => response.data)
      const data = await axios.get('/frontend-version/').then((response) => response.data)

      if (this.versionToInt(data.version) > this.versionToInt(this.version)) {
        this.newVersionAvailable = true
        this.newVersion = data.version
        this.message = `A new version is available`
      } else {
        this.newVersionAvailable = false
      }
    },
    versionToInt(version) {
      return parseInt(version.slice(1).replaceAll('.', ''))
    },
    openReloadModal() {
      if(this.newVersionAvailable) {
        this.$refs['reload-modal'].show()
      }
    },
    doReload() {
      if(!this.newVersionAvailable) {
        this.$refs['reload-modal'].hide()
      } else {
        window.location.reload(false)
      }
    }
  },
  mounted() {
    this.intervalId = setInterval(this.checkVersion, 1000*60*15)
    this.checkVersion()
  },
  beforeDestroy() {
    clearInterval(this.intervalId)
  }
}
</script>

<style scoped>
  .version {
    font-size: 14px;
  }
  .version span {
    text-decoration: none;
    display: block;
    cursor: help;
  }
</style>
