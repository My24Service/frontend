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
      :ok-only="true"
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
import { VERSION } from '@/version'

import axios from "axios";

const version = VERSION
const newVersionAvailable = ref(false)
const newVersion = ref(null)
const reloadModal = useTemplateRef('reload-modal')
// A ref, not the plain `let` this used to be: the title is bound in the
// template, so the "new version available" message never showed without it.
const message = ref(`Using the latest version (${VERSION})`)

// The teardown is the component scope's: `useIntervalFn` pauses on scope
// dispose. The hand-rolled interval never stopped at all - its
// `clearInterval(intervalId)` at unmount passed the ref, not the timer.
const { resume: pollForNewVersion } = useIntervalFn(checkVersion, 1000 * 60 * 15, { immediate: false })

async function checkVersion() {
  if (document.location.protocol === 'https:') {
    const data = await axios.get(`${document.location.origin}/assets/version.json`).then((response) => response.data)
    if (!data.version) {
      return
    }

    if (versionToInt(data.version) > versionToInt(version)) {
      newVersionAvailable.value = true
      newVersion.value = data.version
      message.value = `A new version is available`
    } else {
      newVersionAvailable.value = false
    }
  }
}

function versionToInt(version) {
  return parseInt(version.slice(1).replaceAll('.', ''))
}

function openReloadModal() {
  if(newVersionAvailable.value) {
    reloadModal.value?.show()
  }
}

function doReload() {
  if(!newVersionAvailable.value) {
    reloadModal.value?.hide()
  } else {
    window.location.reload(false)
  }
}

onMounted(() => {
  pollForNewVersion()
  checkVersion()
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
