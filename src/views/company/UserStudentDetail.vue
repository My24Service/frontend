<template>
  <b-overlay rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Student user details') }}</h3>
      <b-row>
        <b-col cols="6">
          <img class="profile-picture" v-bind:src="studentuser.picture_url"  />
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
              <b-td>{{ studentuser.full_name }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
              <b-td>{{ studentuser.address }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Postal') }}</b-td>
              <b-td>{{ studentuser.postal }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('City') }}</b-td>
              <b-td>{{ studentuser.city }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Country') }}</b-td>
              <b-td>{{ studentuser.country_code }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Day of birth') }}</b-td>
              <b-td>{{ studentuser.dob }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Mobile') }}</b-td>
              <b-td>{{ studentuser.mobile }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Email') }}</b-td>
              <b-td>{{ studentuser.email }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('IBAN') }}</b-td>
              <b-td>{{ studentuser.iban }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('BSN') }}</b-td>
              <b-td>{{ studentuser.bsn }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Gender') }}</b-td>
              <b-td>{{ studentuser.gender }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Drivers licence') }}</b-td>
              <b-td>{{ studentuser.drivers_licence }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Drivers licence type') }}</b-td>
              <b-td>{{ studentuser.drivers_licence_type }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Box truck?') }}</b-td>
              <b-td>{{ studentuser.box_truck }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Info') }}</b-td>
              <b-td>{{ studentuser.info }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>
      <footer class="modal-footer">
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}
        </b-button>
      </footer>
    </div>
  </b-overlay>
</template>

<script>
import studentUserModel from '../../models/company/UserStudent.js'

export default {
  data() {
    return {
      studentuser: studentUserModel.getFields(),
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  methods: {
    goBack() {
      this.$router.push({name: 'users-studentusers'})
    },
    async loadData() {
      this.isLoading = true

      try {
        this.studentuser = await studentUserModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching studentuser', error)
        this.errorToast(this.$trans('Error loading studentuser'))
        this.isLoading = false
      }
    },
  },
  async created() {
    await this.loadData()
  }
}
</script>

<style scoped>
  div.profile img.profile-picture {
    width: 100%;
  }

  div.profile div.no-rating {
    font-weight: bold;
    font-style: italic;
  }

  p.no-data {
    text-align: center;
  }
</style>
