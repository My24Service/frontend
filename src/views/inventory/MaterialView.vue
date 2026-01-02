<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiBox></IBiBox>
          <span class="backlink" @click="goBack">{{ $trans("Materials") }}</span> / {{  this.material.name }}
        </h3>
        <div class="flex-columns">
          <BButton @click="goBack" class="btn btn-info" type="button" variant="secondary">
            {{ $trans('Back') }}
          </BButton>
          <router-link :to="{name: 'material-edit', params:{pk: this.pk}}" class="btn">{{ $trans('Edit material') }}</router-link>
        </div>
      </div>
    </header>
    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm" class="flex-columns">
        <div class="panel col-1-3">
          <h3>{{ material.name }}</h3>
          <dl>
            <dt>{{ $trans('Identifier') }}</dt>
            <dd>{{ material.identifier }}</dd>
            <dt>{{ $trans('Shortname') }}</dt>
            <dd>{{ material.name_short }}</dd>
            <dt>{{ $trans('Unit') }}</dt>
            <dd>{{ material.unit }}</dd>
            <dt>{{ $trans('Supplier') }}</dt>
            <dd>{{ material.supplier_name }}</dd>
            <dt>{{ $trans('Product type') }}</dt>
            <dd>{{ material.product_type }}</dd>
          </dl>
          <br>
          <dl>
            <dt>{{ $trans('Purchase price') }}</dt>
            <dd>{{ material.price_purchase }}</dd>
            <dt>{{ $trans('Selling price') }}</dt>
            <dd>{{ material.price_selling }}</dd>
            <dt>{{ $trans('Alt. selling price') }}</dt>
            <dd>{{ material.price_selling_alt }}</dd>
            <dt>{{ $trans('Purchase price ex.') }}</dt>
            <dd>{{ material.price_purchase_ex }}</dd>
            <dt>{{ $trans('Selling price ex.') }}</dt>
            <dd>{{ material.price_selling_ex }}</dd>
            <dt>{{ $trans('Alt. selling price ex.') }}</dt>
            <dd>{{ material.price_selling_alt_ex }}</dd>
          </dl>
          <hr/>
          <img :src="material.image || NO_IMAGE_URL"  :alt="`${material.name} - ${$trans('Product image')}`"/>
        </div>

        <div class="panel col-2-3">
          <h6>{{ $trans('Inventory') }}</h6>
          <b-table :fields="inventoryFields" :items="inventory" responsive="sm"></b-table>
        </div>
      </b-overlay>
    </div>
  </div>
</template>
<style scope>
img {
  display: block;
  margin: auto;
  max-width: 100%;
}

img[src*="no-img.png"] {
  max-width: 320px;
}
</style>
<script>
import materialService from '../../models/inventory/Material.js'
import inventoryModel from '../../models/inventory/Inventory.js'
import {NO_IMAGE_URL} from "../../constants";

export default {
  data() {
    return {
      isLoading: false,
      material: materialService.getFields(),
      inventory: [],
      inventoryFields: [
        { key: 'location_name', label: $trans('Location') },
        { key: 'total_amount', label: $trans('Total amount') },
      ],
      NO_IMAGE_URL
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
        this.material = await materialService.detail(this.pk)
        this.inventory = await inventoryModel.getLocationsForMaterial(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching inventory', error)
        errorToast(this.create, $trans('Error fetching inventory'))
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
