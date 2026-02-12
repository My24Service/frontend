<template>
  <b-modal
    id="modal"
    ref="modal"
    title="Kies product"
    ok-only
    @ok="hide"
  >
    <div v-if="!showForm">
      <b-row>
        <b-col cols="10">
          <b-input
            v-model="query"
          />
        </b-col>
        <b-col cols="2">
          <BButton
            @click="doSearch"
          >Zoeken</BButton>
        </b-col>
      </b-row>

      <b-table
        id="products-table"
        small
        :fields="fields"
        :items="products"
        :hover="true"
        responsive="md"
        tbody-tr-class="table-row"
        @row-clicked="onRowClicked"
      >
      </b-table>
    </div>
    <div v-else>
      <form>
        <BFormGroup
          v-bind:label="$trans('Name')"
          label-for="username-input"
          v-bind:invalid-feedback="$trans('Username is required')"
          :state="form.usernameState"
        >
          <BFormInput
            id="username-input"
            :autofocus="true"
            v-model="form.username"
            :state="form.usernameState"
            :required="true"
            autocomplete="username"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          v-bind:label="$trans('Password')"
          label-for="password-input"
          v-bind:invalid-feedback="$trans('Password is required')"
          :state="form.passwordState"
        >
          <BFormInput
            id="password-input"
            type="password"
            autocomplete="current-password"
            v-model="form.password"
            :state="form.passwordState"
            :required="true"
            v-on:keyup.enter="doLogin"
          ></BFormInput>
        </BFormGroup>
        <div class='flex-columns align-items-center justify-content-center'>
          <BButton type="submit">log in</BButton>
          <BLink @click="function() { forgotPassword() }">{{ $trans('Forgot password?') }}</BLink>
        </div>
      </form>
    </div>

  </b-modal>
</template>
<script>
import componentMixin from "@/mixins/common";
import {TeamleaderService} from "@/models/company/Teamleader";
import {BInput, useToast} from "bootstrap-vue-next";
import {errorToast} from "@/utils";
import {useLoading} from "vue-loading-overlay";

export default {
  name: "ProductChooserTeamleader",
  mixins: [componentMixin],
  components: {BInput},
  props: {
    'material': Object
  },
  emits: [
    'product-chosen'
  ],
  data() {
    return {
      service: new TeamleaderService(),
      products: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
      ],
      query: null,
      showForm: true
    }
  },
  setup() {
    const {create} = useToast()
    const loading = useLoading();

    return {
      create,
      loading
    }
  },
  methods: {
    async doSearch() {
      await this.loadData()
    },
    onRowClicked(item, _index, _event) {
      this.$emit('product-chosen', item)
    },
    async loadData() {
      let loader = this.loading.show();
      try {
        this.products = await this.service.fetchProducts(this.query)
        loader.hide()
      } catch(error) {
        console.log('error fetching products', error)
        errorToast(this.create, this.$trans('Error fetching products'))
        loader.hide()
      }
    },
    async show() {
      await this.$refs['modal'].show()
      this.query = this.material.name.trim()
      await this.loadData()
    },
    hide() {
      this.$refs['modal'].hide()
    }
  },
  created() {
  }
}
</script>
<style scoped>

</style>
