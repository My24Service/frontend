import Vue from 'vue';
import VueI18n from 'vue-i18n'

Vue.use(VueI18n);

const messages = window.django && window.django.catalog || {};
const currentLanguageEl = document.getElementById('current_language');
let currentLanguage = currentLanguageEl ? JSON.parse(currentLanguageEl.textContent) : 'en';
let languageMessages = {};

languageMessages[currentLanguage] = messages;
console.log(currentLanguage, languageMessages);

const i18n = new VueI18n({
  locale: currentLanguage, // set locale
  messages: languageMessages, // set locale messages
});

export default i18n;
