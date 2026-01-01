<template>
    <div class="app-detail">
      <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
      <b-row>
        <b-col cols="2">
          <BLink class="px-1" @click.prevent="backWeek" v-bind:title="$trans('Week back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </BLink>
        </b-col>
        <b-col cols="8">
          {{ $trans('Totals in') }}
          {{ week }}/{{ today.format('Y') }}
          {{ $trans('for') }} {{ fullName }}
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <BLink class="px-1" @click.prevent="nextWeek" v-bind:title="$trans('Next week') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </BLink>
          </div>
        </b-col>
      </b-row>

      <b-table
        id="user-hours-detail-table"
        small
        :fields="fields"
        :items="data"
        responsive="md"
        class="data-table"
      >
      </b-table>
    </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'



export default {
  name: "UserHoursDataDetail",

  data() {
    return {
      today: moment(),
      startDate: null,
      fullName: null,
      data: [],
      fields: [],
    }
  },
  computed: {
    breadcrumb() {
      return [
        {
          text: this.breadcrumb_main_grid_title,
          to: {name: this.main_grid_router_name, query: {date: this.startDate}}
        },
        {
          text: this.breadcrumb_grid_title,
          active: true
        },
      ]
    },
  },
  props: {
    main_grid_router_name: {
      type: [String],
      default: null
    },
    breadcrumb_main_grid_title: {
      type: [String],
      default: null
    },
    breadcrumb_grid_title: {
      type: [String],
      default: null
    }
  },
  async created() {
    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$route.query.date ? this.$moment(this.$route.query.date) : this.$moment().weekday(monday)

    this.setDate()
  },
  methods: {
    setDate() {
      this.startDate = this.today.format('YYYY-MM-DD')
      this.week = this.today.format('[week] W')
    },
    nextWeek() {
      this.today.add(7, 'days')
      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
      }
      this.$router.push({ query }).catch(e => {})
    },
    backWeek() {
      this.today.subtract(7, 'days')
      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
      }
      this.$router.push({ query }).catch(e => {})
    },
    formatValue(val, index) {
      if (this.day_field_types[index] === 'duration') {
        return this.displayDurationFromSeconds(val, true)
      }

      return val
    },
    processData(data) {
      this.fullName = data.full_name
      this.day_fields = data.day_fields
      this.day_field_types = data.day_field_types
      this.fullName = data.full_name

      let header_columns = [{label: $trans('Field'), key: 'field'}]

      // add days
      for(let i=0; i<data.date_list.length; i++) {
        header_columns.push({
          key: `day${i}`,
          label: this.$moment(data.date_list[i]).format('ddd DD'),
          sortable: true
        })
      }

      header_columns.push({
        key: 'total',
        label: $trans('Total'),
        sortable: true
      })

      this.fields = header_columns

      // create array for table
      let results = []

      if (data.result.length) {
        for(let i=0; i<this.day_fields.length; i++) {
          let field = this.day_fields[i]

          let row = {
            field: this.translateHoursField(field)
          }

          for(let j=0; j<data.result[0].day_totals.length; j++) {
            row[`day${j}`] = this.formatValue(data.result[0].day_totals[j][i], i)
          }

          row['total'] = this.formatValue(data.result[0].week_totals[i], i)

          results.push(row)
        }
      }

      this.data = results
    }
  }
}
</script>

<style scoped>

</style>
