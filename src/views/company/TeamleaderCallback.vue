<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon icon="tools"></b-icon>
            {{ $trans("Teamleader API") }}
          </h3>
        </div>
      </header>
      <div class="app-detail panel overflow-auto">
        <div
          class="bg-success text-white p-4 m-4 rounded-sm"
          v-if="isSuccess !== null && isSuccess === true"
        >
          <h1>Gelukt</h1>
          <p class="strong">
            Verbinding met Teamleader is gelegd.
          </p>
          <p>
            U kunt dit venster sluiten.
          </p>
        </div>
        <div
          v-else
          class="bg-warning text-white p-4 m-4 rounded-sm"
        >
          <h1>Mislukt</h1>
          <p class="strong">
            Verbinding met Teamleader is niet gelegd.
          </p>
          <p>
            U kunt dit venster sluiten.
          </p>
        </div>
      </div>
    </div>
  </b-overlay>
</template>
<script>
import {TeamleaderService} from "@/models/company/Teamleader";

export default {
  name: "TeamleaderCallback",
  mixins: [],
  components: {},
  props: {
  },
  emits: [
    'departmentChosen'
  ],
  data() {
    return {
      isLoading: false,
      service: new TeamleaderService(),
      isSuccess: null
    }
  },
  created() {
    this.postCode()
  },
  methods: {
    async postCode() {
      try {
        const code = this.$route.query.code
        const state = this.$route.query.state
        this.isLoading = true
        const result = await this.service.oauthPost(code, state)
        this.isLoading = false
        console.log({result})
        if (result.status === 'ok') {
          this.isSuccess = true
        }
      } catch(error) {
        console.log('error fetching departments', error)
        // this.errorToast(this.$trans('Error getting tokens'))
        this.isSuccess = false
        this.isLoading = false
      }
    }
  }
}
</script>
<style scoped>
h1, p {
  text-align: center;
}
p.strong {
  font-weight: bold;
  font-size: 1.2em;
}
</style>
