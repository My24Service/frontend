<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
          <router-link :to="{ name: 'sick-leave-list' }">{{ $trans("Sick leave") }}</router-link>
          /
          <span class="dimmed">
            <span v-if="isCreate">{{ $trans("new") }}</span>
            <span v-if="!isCreate">{{ $trans("edit") }}</span>
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
          <h6>{{ $trans("Sick leave") }}</h6>
          <BFormGroup
            v-if="isCreate"
            label-size="sm"
            label-class="p-sm-0"
            v-bind:label="$trans('Search existing user')"
            label-for="user-search"
          >
            <multiselect
              id="user-search"
              track-by="id"
              :placeholder="$trans('Type to search')"
              open-direction="bottom"
              :options="users"
              :multiple="false"
              :loading="compLoading"
              :internal-search="false"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :hide-selected="true"
              @search-change="getUsersDebounced"
              @select="selectUser"
              :custom-label="userLabel"
            >
              <span slot="noResult">{{ $trans('Nothing found.') }}</span>
            </multiselect>
          </BFormGroup>
          <BFormGroup
            v-if="isCreate"
            label-class=""
            :label="$trans('User')"
            label-for="user"
            cols="4"
          >
            <BFormInput
              id="total_time"
              v-model="userName"
              placeholder="User"
              :readonly="true"
            ></BFormInput>
            <b-form-invalid-feedback :state="isSubmitClicked ? !v$.leave.user.$error : null">
              {{ $trans("Please select a user") }}
            </b-form-invalid-feedback>
          </BFormGroup>
          <div class="flex-columns">
            <BFormGroup :label="$trans('Start date')" label-for="start_date" cols="4">
              <VueDatePicker
                id="start_date"
                class=""
                v-model="leave.start_date"
                :placeholder="$trans('Select date')"
                value="leave.start_date"
                locale="nl"
                :state="isSubmitClicked ? !v$.leave.start_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></VueDatePicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.leave.start_date.$error : null"
              >
                {{ $trans("Please enter a start date") }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>
        </div>
      </div>
    </b-overlay>
  </div>
</template>
<script>
import moment from "moment";
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { UserListService } from "@/models/company/UserList.js";
import { SickLeavesService } from "@/models/company/SickLeave.js";
import Multiselect from 'vue-multiselect'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()
    return {
      v$: useVuelidate(),
      create
    }
  },
  components: {
    Multiselect,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    }
  },
  validations() {
    return {
      leave: {
        user: {
          required
        },
        start_date: {
          required
        }
      }
    };
  },
  data() {
    return {
      userListService: new UserListService(),
      sickLeavesService: new SickLeavesService(),
      isLoading: false,
      compLoading: false,
      loadingTotals: false,
      submitClicked: false,
      users: [],
      getUsersDebounced: null,
      userName: '',
      leave: {
        user: null,
        start_date: moment().format("YYYY-MM-DD"),
      },
      leaveTypes: [],
      endTimeInvalid: true,
      startTimeInvalid: true
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
  created() {
    const lang = this.$store.getters.getCurrentLanguage;
    this.$moment = moment;
    this.$moment.locale(lang);

    if (!this.isCreate) {
      this.loadData();
    }
    this.getUsersDebounced = AwesomeDebouncePromise(this.getUsers, 500)
  },
  methods: {
    async submitForm() {
      this.submitClicked = true;
      this.v$.$touch();
      if (this.v$.$invalid) {
        console.log("invalid?", this.v$.$invalid);
        return;
      }

      this.isLoading = true;

      if (this.isCreate) {
        try {
          await this.sickLeavesService.insert(this.leave);
          infoToast(this.create, $trans("Created"), $trans("Leave has been created"));
          this.isLoading = false;
          this.$router.go(-1);
        } catch (error) {
          console.log("Error creating leave", error);
          errorToast(this.create, $trans("Error creating leave"));
          this.isLoading = false;
        }

        return;
      }

      try {
        await this.sickLeavesService.update(this.pk, this.leave);
        infoToast(this.create, $trans("Updated"), $trans("Leave has been updated"));
        this.isLoading = false;
        this.$router.go(-1);
      } catch (error) {
        console.log("Error updating leave", error);
        errorToast(this.create, $trans("Error updating leave"));
        this.isLoading = false;
      }
    },
    async selectUser(option) {
      this.leave.user = option.id
      this.userName = option.name
    },
    userLabel({ name }) {
      return name
    },
    async getUsers (query) {
      if (query === '') return
      this.compLoading = true

      try {
        this.users = await this.userListService.search(query)
        this.compLoading = false
      } catch(error) {
        console.log('Error fetching users', error)
        errorToast(this.create, $trans('Error fetching users'))
        this.compLoading = false
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        this.leave = await this.sickLeavesService.detail(this.pk);
        this.userName = this.leave.user_full_name
        this.leave.start_date = this.$moment(this.leave.start_date, "DD/MM/YYYY").format(
          "YYYY-MM-DD"
        )
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching sick leave", error);
        errorToast(this.create, $trans("Error loading sick leave"));
        this.isLoading = false;
      }
    },
    cancelForm() {
      this.$router.go(-1);
    }
  }
};
</script>
