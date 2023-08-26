<template>
  <div class="customer-details">
    <b-row align-h="center">
      <h2>{{ customer.name }}</h2>
    </b-row>
    <b-row>
      <b-col cols="6">
        <b-table-simple>
          <b-tr>
            <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
            <b-td>{{ customer.name }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
            <b-td>{{ customer.address }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Postal') }}:</strong></b-td>
            <b-td>{{ customer.postal }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('City') }}:</strong></b-td>
            <b-td>{{ customer.city }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Country') }}:</strong></b-td>
            <b-td>{{ customer.country_code }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Customer ID') }}:</strong></b-td>
            <b-td>{{ customer.customer_id }}</b-td>
          </b-tr>
        </b-table-simple>
      </b-col>
      <b-col cols="6">
        <b-table-simple>
          <b-tr>
            <b-td><strong>{{ $trans('Ext. identifier') }}:</strong></b-td>
            <b-td>{{ customer.external_identifier }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
            <b-td>{{ customer.email }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Tel.') }}:</strong></b-td>
            <b-td>{{ customer.tel }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
            <b-td>{{ customer.mobile }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
            <b-td>{{ customer.contact }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Remarks') }}:</strong></b-td>
            <b-td>{{ customer.remarks }}</b-td>
          </b-tr>
        </b-table-simple>
      </b-col>
    </b-row>
  </div>
</template>

<script>
export default {
  name: "CustomerDetail",
  props: {
    customer: {
      type: [Object],
      default: null
    },
  }
}
</script>

<style scoped>

</style>
