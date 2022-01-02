<template>
  <b-form ref='language-chooser' inline>
    <b-form-select size="sm" v-model="selected" :options="languages"></b-form-select>
    <b-button size="sm" @click="setLanguage">Go</b-button>
  </b-form>
</template>

<script>
const languagesEl = document.getElementById('languages');
const languagesIn = languagesEl ? JSON.parse(languagesEl.textContent) : [["en", "English"]];
let languages = [];

for (let i=0;i<languagesIn.length; i++) {
  languages.push({
    'value': languagesIn[i][0],
    'text': `${languagesIn[i][1]} (${languagesIn[i][0]})`
  });
}

export default {
  name: "TheLanguageChooser",
  computed: {
    languages() {
      return languages;
    }
  },
  data() {
    return {
      selected: this.$store.state.currentLanguage
    }
  },
  methods: {
    setLanguage(event) {
      this.$store.dispatch('getCsrfToken').then((token) => {
        this.$store.dispatch('setLanguage', {
          'language': this.selected,
          token
        }).then(() => window.location.reload());
      });
    }
  }
}
</script>

<style scoped>
</style>
