<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-check-fill"></b-icon>
          <router-link :to="{ name: 'company-templates' }">{{ $trans("Templates") }}</router-link>
          /
          <strong>{{ template.name }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !template.id">{{ $trans("new") }}</span>
            <span v-if="!isCreate && isEdit">{{ $trans("edit") }}</span>
          </span>
        </h3>
        <div class="flex-columns" v-if="isCreate || isEdit">
          <b-button @click="cancelForm" type="button" variant="secondary">
            {{ $trans("Cancel") }}</b-button
          >
          <b-button @click="submitForm" type="button" variant="primary">
            {{ $trans("Submit") }}</b-button
          >
        </div>
        <div class="flex-columns" v-if="!isCreate && !isEdit">
          <b-button @click="isEdit = true" type="button" variant="primary">
            {{ $trans("Edit template") }}</b-button
          >
        </div>
      </div>
    </header>
    <b-overlay rounded="sm">
      <div class="page-detail">
        <div class="flex-columns">
          <div class="panel" v-if="isCreate || isEdit">
            <h6>{{ $trans("Template") }}</h6>
            <b-form-group v-bind:label="$trans('Name')" label-for="template_name" label-cols="3">
              <b-form-input
                autofocus
                id="template_name"
                size="sm"
                v-model="template.name"
                :state="isSubmitClicked ? !v$.template.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback :state="isSubmitClicked ? !v$.template.name.$error : null">
                {{ $trans("Please enter a template name") }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-cols="3"
              v-bind:label="$trans('Description')"
              label-for="template_description"
            >
              <b-form-textarea
                id="template_description"
                v-model="template.description"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
            <b-form-group
              label-cols="3"
              v-bind:label="$trans('Type')"
              label-for="template_type"
              v-if="isCreate"
            >
              <b-form-select
                id="template_type"
                v-model="template.template_type"
                :options="templateTypes"
                size="sm"
                :state="isSubmitClicked ? !v$.template.template_type.$error : null"
              ></b-form-select>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.template.template_type.$error : null"
              >
                {{ $trans("Please select a template type") }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group v-bind:label="$trans('Choose template')" label-cols="3">
              <b-form-file
                v-model="file"
                v-bind:placeholder="$trans('Choose a word document or drop it here...')"
                @input="filesSelected"
                :state="isSubmitClicked ? !v$.template.file.$error : null"
                accept=".docx"
              ></b-form-file>
              <b-form-invalid-feedback :state="isSubmitClicked ? !v$.template.file.$error : null">
                {{ $trans("Please select a file") }}
              </b-form-invalid-feedback>
            </b-form-group>
          </div>
          <div class="panel" v-if="!isCreate && !isEdit">
            <h6>{{ $trans("Template") }}</h6>
            <b-row>
              <b-col cols="3">
                {{ $trans("Name") }}:
              </b-col>
              <b-col cols="6">
                {{ template.name }}
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="3">
                {{ $trans("Description") }}:
              </b-col>
              <b-col cols="6">
                {{ template.description }}
              </b-col>
            </b-row>
          </div>
          <div class="panel" v-if="!isCreate && !isEdit">
            <h6>{{ $trans("Template preview") }}</h6>
            <b-form-group
              label-cols="3"
              v-bind:label="$trans('Template')"
              label-for="template-search"
            >
              <multiselect
                id="template-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="results"
                :loading="fetchingResults"
                :multiple="false"
                :internal-search="false"
                :clear-on-select="false"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :hide-selected="true"
                @search-change="searchPreviewDebounced"
                @select="result => selectResult(result, index)"
                :custom-label="result => result.name"
                ref="searchTemplate"
              >
              </multiselect>
            </b-form-group>
            <b-row>
              <b-col cols="3" v-if="result">
                {{ result.name }}
              </b-col>
              <b-col cols="3" v-if="result">
                <b-button @click="previewPdf" type="button" variant="primary">
                  {{ $trans("Preview pdf") }}
                </b-button>
              </b-col>
            </b-row>
          </div>
        </div>
      </div>
    </b-overlay>
  </div>
</template>
<script>
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import {
  TemplateService,
  TemplateModel
} from "../../../models/company/Template.js";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import { QuotationService } from "../../../models/quotations/Quotation.js";
import Multiselect from "vue-multiselect";

export default {
  components: {
    Multiselect
  },
  setup() {
    return { v$: useVuelidate() };
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    }
  },
  computed: {
    isCreate() {
      return !this.pk;
    }
  },
  validations() {
    return {
      template: {
        name: {
          required
        },
        file: {
          required
        },
        template_type: {
          required
        }
      }
    };
  },
  created() {
    this.searchPreviewDebounced = AwesomeDebouncePromise(this.searchPreview, 500);
    this.template = new TemplateModel({});

    if (!this.isCreate) {
      this.loadData();
    }
  },
  data() {
    return {
      isEdit: false,
      isSubmitClicked: false,
      templateService: new TemplateService(),
      file: null,
      template: {},
      templateTypes: [
        //{ value: "invoice", text: this.$trans("Invoice") },
        { value: "quotation", text: this.$trans("Quotation") }
      ],
      results: [],
      fetchingResults: false,
      searchPreviewDebounced: "",
      // TODO make this dynamic based on template type (invoices, etc.)
      quotationService: new QuotationService(),
      result: ""
    };
  },
  methods: {
    filesSelected(file) {
      const reader = new FileReader();
      reader.onload = f => {
        const b64 = f.target.result;
        this.template.file = b64;
      };
      reader.readAsDataURL(file);
    },
    async loadData() {
      this.isLoading = true;

      try {
        this.template = await this.templateService.detail(this.pk);
        this.file = this.template.filename
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching template", error);
        this.errorToast(this.$trans("Error loading template"));
        this.isLoading = false;
      }
    },
    cancelForm() {
      if (this.isCreate) {
        this.$router.go(-1);
      } else {
        this.isEdit = false;
        this.loadData()
      }
    },
    async searchPreview(query) {
      this.fetchingResults = true;
      try {
        this.results = await this.quotationService.search(query);
        this.fetchingResults = false;
      } catch (error) {
        console.log("Error fetching results", error);
        this.errorToast(this.$trans("Error fetching results"));
        this.fetchingResults = false;
      }
    },
    async submitForm() {
      this.isSubmitClicked = true;
      this.v$.$touch();
      if (this.v$.$invalid) {
        console.log("invalid?", this.v$.$invalid);
        return;
      }
      this.isLoading = true;

      if (this.isCreate) {
        try {
          await this.templateService.insert(this.template);
          this.infoToast(this.$trans("Created"), this.$trans("Template has been created"));
          this.isLoading = false;
          this.$router.go(-1);
        } catch (error) {
          console.log("Error creating template", error);
          this.errorToast(this.$trans("Error creating template"));
          this.isLoading = false;
        }
      }

      if (this.isEdit) {
        // Remove file if none was uploaded to replace the existing one
        if (!this.file.name) {
          delete this.template.file
        }

        try {
          await this.templateService.update(this.pk, this.template);
          this.infoToast(this.$trans("Created"), this.$trans("Template has been updated"));
          this.isLoading = false;
          this.isEdit = false
          this.template = {}
          await this.loadData()
        } catch (error) {
          console.log("Error creating template", error);
          this.errorToast(this.$trans("Error creating template"));
          this.isLoading = false;
        }
      }
    },
    async previewPdf() {
      this.isLoading = true;
      const data = {
        id: this.pk,
        uuid: this.result.uuid,
        template_type: this.template.template_type
      }

      try {
        const blob = await this.templateService.previewPdfTemplate(data);
        this.isLoading = false;
        const _url = window.URL.createObjectURL(blob);
        window.open(_url, "_blank");
      } catch (error) {
        console.log("Error downloading template", error);
        this.errorToast(this.$trans("Error downloading template"));
        this.isLoading = false;
      }
    },
    selectResult(result, index) {
      this.result = result;
    }
  }
};
</script>
<style scoped>
.pdf-priview {
  margin-top: 20px;
}

.pdf-priview .panel {
  max-width: 70%;
}
</style>
