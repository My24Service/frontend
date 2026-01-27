<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiShop></IBiShop>
          <span class="backlink" @click="goBack">{{ $trans('Suppliers') }}</span> / {{ supplier.name }}
        </h3>
        <div class="flex-columns">
          <BButton @click="goBack" class="btn btn-info" type="button" variant="secondary">
            {{ $trans('Back') }}</BButton>
          <router-link :to="{name: 'supplier-edit', params: {pk: this.pk}}" class="btn"> {{$trans('Edit supplier') }}</router-link>
          </div>
      </div>
    </header>
    <div class="page-detail flex-columns">
      <div class="panel col-1-3">
        <h6>{{ $trans('Supplier') }}</h6>
        <dl>
          <dt>{{ $trans('Identifier') }}</dt>
          <dd>{{ supplier.identifier }}</dd>

          <dt>{{ $trans('Name') }}</dt>
          <dd>{{ supplier.name }}</dd>

          <dt>{{ $trans('Address') }}</dt>
          <dd>{{ supplier.address }}</dd>

          <dt>{{ $trans('Country/Postal/city') }}</dt>
          <dd>
            {{ supplier.country_code }}-
            {{ supplier.postal }} {{ supplier.city }}
          </dd>

        </dl>

        <dl>

          <dt>{{ $trans('Contact') }}</dt>
          <dd>{{ supplier.order_contact }}</dd>

          <dt>{{ $trans('Tel.') }}</dt>
          <dd>{{ supplier.order_tel }}</dd>

          <dt>{{ $trans('Mobile') }}</dt>
          <dd>{{ supplier.order_mobile }}</dd>

          <dt>{{ $trans('Email') }}</dt>
          <dd>
            <BLink class="px-1" v-bind:href="`mailto:${supplier.order_email}`">
              {{ supplier.order_email }}
            </BLink>
          </dd>

          <dt>{{ $trans('Remarks') }}</dt>
          <dd>{{ supplier.remarks }}</dd>

        </dl>
      </div>
      <div class="panel col-2-3">
        <h6>{{ $trans('Materials') }}</h6>
        <b-table
          id="materials-table"
          :fields="materialFields"
        ></b-table>
      </div>
    </div>
  </div>

</template>

<script>
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'
import {useToast} from "bootstrap-vue-next";
import componentMixin from "@/mixins/common";
import {errorToast} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create,
    }
  },
  mixins: [componentMixin],
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      supplier: supplierModel.getFields(),
      materials: [],
      materialFields: [
        { key: 'name', label: this.$trans('Name') },
        { key: 'unit', label: this.$trans('Unit') },
        { key: 'modified', label: this.$trans('Modified') }
      ],
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
      this.$router.go(-1)
    },
    async loadData() {
      this.isLoading = true

      try {
        this.supplier = await supplierModel.detail(this.pk)
        this.materials = await materialModel.getForSupplier(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching supplier/materials', error)
        errorToast(this.create, this.$trans('Error fetching supplier/materials'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
  }
}
</script>

<style scoped>
</style>
