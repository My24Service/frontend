<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
          <router-link :to="{ name: statusCodeListLink }">{{ $trans("Statuscodes") }}</router-link>
          /
          <strong>{{ statuscode.statuscode }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !statuscode.statuscode">{{ $trans("new") }}</span>
            <span v-if="!isCreate && !statuscode.statuscode">{{ $trans("edit") }}</span>
          </span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" type="button" variant="secondary">
            {{ $trans("Cancel") }}</BButton
          >
          <BButton @click="submitForm" type="button" variant="primary">
            {{ $trans("Submit") }}</BButton
          >
        </div>
      </div>
    </header>
    <b-overlay :show="isLoading" rounded="sm">
      <div class="page-detail flex-columns">
        <div class="panel">
          <h6>{{ $trans("Settings") }}</h6>
          <BFormGroup
            v-bind:label="$trans('Statuscode')"
            label-for="statuscode_statuscode"
            label-cols="3"
          >
            <BFormInput
              autofocus
              id="statuscode_statuscode"
              size="sm"
              v-model="statuscode.statuscode"
              :state="isSubmitClicked ? !v$.statuscode.statuscode.$error : null"
            ></BFormInput>
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.statuscode.statuscode.$error : null"
            >
              {{ $trans("Please enter a statuscode") }}
            </b-form-invalid-feedback>
          </BFormGroup>

          <BFormGroup
            label-cols="3"
            v-bind:label="$trans('New status template')"
            label-for="statuscode_new_status_template"
            :description="$trans('For statuses that are not set by the application.')"
          >
            <BFormInput
              id="statuscode_new_status_template"
              size="sm"
              v-model="statuscode.new_status_template"
            >
            </BFormInput>
          </BFormGroup>

          <BFormGroup
            label-cols="3"
            v-bind:label="$trans('Description')"
            label-for="statuscode_description"
          >
            <BFormTextarea
              id="statuscode_description"
              v-model="statuscode.description"
              rows="3"
            ></BFormTextarea>
          </BFormGroup>

          <h6>{{ $trans("Label") }}</h6>
          <BFormGroup label-cols="3" label="Label preview">
            <small
              class="statuscode-preview"
              :style="`--bg-color: ${statuscode.color}; --text-color: ${statuscode.text_color}`"
            >
              {{ statuscode.statuscode || "statuscode text" }}
            </small>
          </BFormGroup>
          <BFormGroup
            label-cols="3"
            v-bind:label="$trans('Label color')"
            label-for="statuscode_color"
            :state="isSubmitClicked ? !v$.statuscode.color.$error : null"
            :description="$trans('Use this color in dispatch.')"
            invalid-feedback="Please choose a color"
          >
            <color-picker
              id="statuscode_color"
              class="color-picker-placeholder"
              v-model="statuscode.color"
            ></color-picker>
          </BFormGroup>

          <BFormGroup
            label-cols="3"
            v-bind:label="$trans('Text color')"
            label-for="statuscode_text_color"
            :description="$trans('Use this text color in dispatch.')"
          >
            <color-picker
              id="statuscode_color"
              class="color-picker-placeholder"
              v-model="statuscode.text_color"
            ></color-picker>
          </BFormGroup>
          <ExpiryConditionForm
            :statuscode="statuscode"
            @expiry-condition-changed="updateStatuscode"
          />
        </div>
      </div>
    </b-overlay>
  </div>
</template>

<style scoped>
input[type="color"] {
  width: calc(1.5em + 0.75rem + 2px);
}
</style>

<script>
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";

import {
  QuotationStatuscodeService,
  QuotationStatuscodeModel
} from "@/models/quotations/QuotationStatuscode.js";
import ExpiryConditionForm from "./ExpiryConditionForm";
import {
  STATUSCODE_TYPE_LEAVE_HOURS,
  STATUSCODE_TYPE_QUOTATION, STATUSCODE_TYPE_SICK_LEAVE,
  STATUSCODE_TYPE_WORK_HOURS
} from "@/models/company/AbstractStatuscode";
import {
  LeaveStatuscodeModel,
  LeaveStatuscodeService
} from "@/models/company/LeaveStatuscode";
import {
  SickLeaveStatuscodeModel,
  SickLeaveStatuscodeService
} from "@/models/company/SickLeaveStatuscode";
import {
  WorkHoursStatuscodeModel,
  WorkHoursStatuscodeService
} from "@/models/company/WorkHoursStatuscode";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  components: {
    ExpiryConditionForm
  },
  props: {
    list_type: {
      type: [String],
      default: "order"
    },
    pk: {
      type: [String, Number],
      default: null
    }
  },
  validations() {
    return {
      statuscode: {
        statuscode: {
          required
        },
        color: {
          required
        }
      }
    };
  },
  data() {
    return {
      // type based variables
      statuscodeModel: null,
      statuscodeService: null,
      isLoading: false,
      submitClicked: false,
      statuscode: {},
      errorMessage: null,
      statusCodeListLink: ""
    };
  },
  computed: {
    isCreate() {
      return !this.pk;
    },
    isSubmitClicked() {
      return this.submitClicked;
    }
  },
  async created() {
    this.statusCodeListLink = `company-statuscodes-${this.list_type}`;

    switch (this.list_type) {
      // case "order":
      //   this.statuscodeModel = statuscodeOrderModel;
      //   break;
      case STATUSCODE_TYPE_QUOTATION:
        this.statuscodeService = new QuotationStatuscodeService();
        this.statuscode = new QuotationStatuscodeModel({});
        break;
      case STATUSCODE_TYPE_LEAVE_HOURS:
        this.statuscodeService = new LeaveStatuscodeService();
        this.statuscode = new LeaveStatuscodeModel({});
        break;
      case STATUSCODE_TYPE_SICK_LEAVE:
        this.statuscodeService = new SickLeaveStatuscodeService();
        this.statuscode = new SickLeaveStatuscodeModel({});
        break;
      case STATUSCODE_TYPE_WORK_HOURS:
        this.statuscodeService = new WorkHoursStatuscodeService();
        this.statuscode = new WorkHoursStatuscodeModel({});
        break;
      default:
        throw `unknown list_type: ${this.list_type}`;
    }

    if (!this.isCreate) {
      await this.loadData();
    }
  },
  methods: {
    async submitForm() {
      this.submitClicked = true;
      this.v$.$touch();
      if (this.v$.$invalid) {
        console.log("invalid?", this.v$.$invalid);
        return;
      }

      // remove null fields
      const null_fields = ["new_status_template", "description"];
      for (let i = 0; i < null_fields.length; i++) {
        if (this.statuscode[null_fields[i]] === null || this.statuscode[null_fields[i]] === "") {
          delete this.statuscode[null_fields[i]];
        }
      }

      this.isLoading = true;

      if (this.isCreate) {
        try {
          await this.statuscodeService.insert(this.statuscode);
          infoToast(this.create, $trans("Created"), $trans("Statuscode has been created"));
          this.isLoading = false;
          this.$router.go(-1);
        } catch (error) {
          console.log("Error creating statuscode", error);
          errorToast(this.create, $trans("Error creating statuscode"));
          this.isLoading = false;
        }

        return;
      }

      try {
        await this.statuscodeService.update(this.pk, this.statuscode);
        infoToast(this.create, $trans("Updated"), $trans("Statuscode has been updated"));
        this.isLoading = false;
        this.$router.go(-1);
      } catch (error) {
        console.log("Error updating statuscode", error);
        errorToast(this.create, $trans("Error updating statuscode"));
        this.isLoading = false;
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        this.statuscode = await this.statuscodeService.detail(this.pk);
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching statuscode", error);
        errorToast(this.create, $trans("Error loading statuscode"));
        this.isLoading = false;
      }
    },
    cancelForm() {
      this.$router.go(-1);
    },
    updateStatuscode(data) {
      Object.assign(this.statuscode, data)
    }
  }
};
</script>
