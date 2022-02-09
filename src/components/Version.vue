<template>
  <div>
    <b-modal
      id="reload-modal"
      ref="reload-modal"
      v-bind:title="$trans('Reload page?')"
      @ok="doReload"
    >
      <p class="my-4">
        {{ $trans('A new version is available:') }}: {{ newVersion }} {{ $trans('Do you want to reload the page?') }}
      </p>
    </b-modal>

    <div class="version">
      <h6>{{ version }}
        <b-badge v-if="newVersionAvailable">
          <b-link @click="openReloadModal">{{ $trans('New version available')  }}</b-link>
        </b-badge>
      </h6>
    </div>
  </div>
</template>

<script>
import { VERSION } from '@/version'
import axios from '@/services/api'

export default {
  name: "Version",
  data() {
    return {
      version: VERSION,
      newVersionAvailable: false,
      newVersion: null
    }
  },
  methods: {
    async checkVersion() {
      const data = await axios.get('/frontend-version/').then((response) => response.data)
      if (data.version !== this.version) {
        this.newVersionAvailable = true
        this.newVersion = data.version
      }
    },
    openReloadModal() {
      this.$refs['reload-modal'].show()
    },
    doReload() {
      window.location.reload(false)
    }
  },
  mounted() {
    setInterval(this.checkVersion, 1000*60*15)
    this.checkVersion()
  }
}
</script>

<style scoped>
  .version {
    padding-top: 6px;
    padding-left: 8px;
    color: white;
    font-size: 14px;
  }
  .version a {
    color: white;
    text-decoration: none;
  }
</style>
