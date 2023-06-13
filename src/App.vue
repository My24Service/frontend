<template>
  <div id="app">
    <router-view/>
    <v-tour name="myTour" :steps="steps" :callbacks="myCallbacks"></v-tour>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      steps: [
        { 
          target: '.navbar-nav',
          content: 'Dit is het hoofdmenu',
          params: {
            
            
          }
        },
        {
          target: '.page-subnav',
          content: 'Dan heb je hier het submenu per pagina'
        }
      ],
      myCallbacks: {
        onStop: function () {
          localStorage.setItem('tour-complete', true)
        }
      }
    }
  },
  mounted: function () {
    if(!localStorage.getItem('tour-complete')) {
      this.$tours['myTour'].start()
    } else {
      console.log('tour already completed')
    }
    
  }
};
</script>

<style>
</style>
