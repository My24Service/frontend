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
      ok-only="true"
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

<script setup>
import { VERSION } from '@/version.js'
import {onMounted, onUnmounted, ref} from "vue";
import {$trans} from "@/utils";

const version = VERSION
const newVersionAvailable = ref(false)
const newVersion = ref(null)
const intervalId = ref(null)
const message = `Using the latest version (${VERSION})`

async function checkVersion() {
  // TODO implement this
  // https://api.github.com/My24Service/frontend/releases
  // const data = await axios.get('https://api.github.com/repos/OWNER/REPO/tags').then((response) => response.data)

  // if (this.versionToInt(data.version) > this.versionToInt(this.version)) {
  //   this.newVersionAvailable = true
  //   this.newVersion = data.version
  //   this.message = `A new version is available`
  // } else {
    newVersionAvailable.value = false
  // }
}

function versionToInt(version) {
  return parseInt(version.slice(1).replaceAll('.', ''))
}

function openReloadModal() {
  if(newVersionAvailable.value) {
    this.$refs['reload-modal'].show()
  }
}

function doReload() {
  if(!newVersionAvailable.value) {
    this.$refs['reload-modal'].hide()
  } else {
    window.location.reload(false)
  }
}

onMounted(() => {
  intervalId.value = setInterval(checkVersion, 1000*60*15)
  checkVersion()
})

onUnmounted(() => {
  clearInterval(intervalId)
})
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
