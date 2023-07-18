<template>
  <span class="version">
    <b-link class="dropdown-item" @click="openReloadModal">{{ version }}
      <b-badge v-if="newVersionAvailable">
        {{ $trans('update')  }}
      </b-badge>
    </b-link>

    <b-modal
      id="reload-modal"
      ref="reload-modal"
      v-bind:title="$trans('Reload page?')"
      @ok="doReload"
    >
      <p class="my-4" v-if="newVersionAvailable">
        {{ $trans('A new version is available') }}: {{ newVersion }} {{ $trans('Do you want to reload the page?') }}
      </p>
      <p class="my-4" v-else>Using the latest version.</p>
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
      intervalId: null
    }
  },
  methods: {
    async checkVersion() {
      const data = await axios.get('/frontend-version/').then((response) => response.data)

      if (this.versionToInt(data.version) > this.versionToInt(this.version)) {
        this.newVersionAvailable = true
        this.newVersion = data.version
      } else {
        this.newVersionAvailable = false
      }
    },
    versionToInt(version) {
      return parseInt(version.slice(1).replaceAll('.', ''))
    },
    openReloadModal() {
      this.$refs['reload-modal'].show()
    },
    doReload() {
      window.location.reload(false)
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
  .version a {
    text-decoration: none;
  }
</style>
