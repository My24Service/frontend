<script>
import {TeamleaderService} from "@/models/company/Teamleader";

export default {
  name: "DocumentTemplateChooser",
  mixins: [],
  components: {},
  props: {
  },
  emits: [
    'documentChosen'
  ],
  data() {
    return {
      isLoading: false,
      service: new TeamleaderService(),
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.isLoading = true
      try {
        this.settings = await this.service.configDetail()
        this.isLoading = false

      } catch(error) {
        console.log('error fetching config', error)
        this.errorToast(this.$trans('Error fetching config'))
        this.isLoading = false
      }
    },
  }
}

</script>

<template>
  <div>

  </div>
</template>

<style scoped>

</style>
