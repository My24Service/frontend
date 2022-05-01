<template>
	<div class="container app-form">
		<v-calendar
			ref="calendar"
			:rows="3"
			:columns="4"
			:from-date="startDate"
			is-expanded
			show-weeknumbers
		/>
	</div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

const d = new Date()

export default {
  name: "Calendar",
  data() {
  	return {
  		startDate: null
  	}
  },
  async created() {
    this.startDate = moment(`${d.getYear()+1900}-01-01`, 'YYYY-MM-DD').toDate()
  }
}
</script>

<style scoped>
</style>


