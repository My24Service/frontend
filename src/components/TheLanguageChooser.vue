<template>
  <b-form ref='language-chooser'>
    <div class="flex-columns">
      <BFormSelect size="sm" v-model="selected" :options="languages"></BFormSelect>
      <BButton variant="primary" size="sm" @click="setLanguage">{{ $trans('Go') }}</BButton>
    </div>
  </b-form>
</template>

<script>
import {setLanguageCreate} from '@/api/sdk.gen'

export default {
  name: "TheLanguageChooser",
  setup() {
    const mainStore = useMainStore()

    return {
      mainStore
    }
  },
  data() {
    return {
      languages: [],
      selected: this.mainStore.getCurrentLanguage,
    }
  },
  methods: {
    async setLanguage() {
      try {
        // withCredentials: in dev the API is on another port, and the browser
        // drops a cross-origin Set-Cookie unless the request sends credentials.
        await setLanguageCreate({body: {language: this.selected}, withCredentials: true, throwOnError: true})
        this.mainStore.setLanguage(this.selected)
        window.location.reload()
      } catch (error) {
        console.log(error)
      }
    }
  },
  mounted() {
    const languagesIn = this.mainStore.getLanguages
    let languages = [];

    for (let i=0;i<languagesIn.length; i++) {
      languages.push({
        'value': languagesIn[i][0],
        'text': `${languagesIn[i][1]} (${languagesIn[i][0]})`
      });
    }

    this.languages = languages
  }
}
</script>

<style scoped>
</style>
