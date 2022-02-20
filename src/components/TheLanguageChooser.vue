<template>
  <b-form ref='language-chooser' inline>
    <b-form-select size="sm" v-model="selected" :options="languages"></b-form-select>
    <b-button size="sm" @click="setLanguage">Go</b-button>
  </b-form>
</template>

<script>
import accountModel from '@/models/account/Account.js'

export default {
  name: "TheLanguageChooser",
  data() {
    return {
      languages: [],
      selected: this.$store.getters.getCurrentLanguage
    }
  },
  methods: {
    async setLanguage(event) {
      try {
        await accountModel.setLanguage(this.selected)
        this.$store.dispatch('setLanguage')
        window.location.reload()
      } catch (error) {
        console.log(error)
      }
    }
  },
  mounted() {
    const languagesIn = this.$store.getters.getLanguages
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
