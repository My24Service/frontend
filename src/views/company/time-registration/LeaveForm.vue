<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
          <router-link :to="{ name: 'leave-list' }">{{ $trans("Leave") }}</router-link>
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
          <h6>{{ $trans("Request leave") }}</h6>
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
            cols="3"
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
          <BFormGroup v-bind:label="$trans('Leave type')" label-for="leave_type" label-cols="3">
            <BFormSelect
              v-model="leave.leave_type"
              :options="leaveTypes"
              value-field="id"
              text-field="name"
              :state="isSubmitClicked ? !v$.leave.leave_type.$error : null"
            ></BFormSelect>
            <b-form-invalid-feedback :state="isSubmitClicked ? !v$.leave.leave_type.$error : null">
              {{ $trans("Please select a leave type") }}
            </b-form-invalid-feedback>
          </BFormGroup>
          <BFormGroup
            label-cols="3"
            v-bind:label="$trans('Description')"
            label-for="leave_description"
          >
            <BFormTextarea
              id="leave_description"
              v-model="leave.description"
              rows="3"
            ></BFormTextarea>
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
                @input="() => loadTotals(leave)"
                :state="isSubmitClicked ? !v$.leave.start_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></VueDatePicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.leave.start_date.$error : null"
              >
                {{ $trans("Please enter a start date") }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup :label="$trans('Whole day')" cols="4">
              <BFormCheckbox
                id="leave_start_date_is_whole_day"
                v-model="leave.start_date_is_whole_day"
                name="leave_start_date_is_whole_day"
              ></BFormCheckbox>
            </BFormGroup>
            <BFormGroup
              v-if="!leave.start_date_is_whole_day"
              label-class=""
              :label="$trans('Start time')"
              label-for="start_time"
              cols="4"
            >
              <BFormInput
                id="start_time"
                v-model="leave.start_time"
                type="text"
                placeholder="HH:mm"
                @input="startTimeChanged"
                :state="isSubmitClicked ? !startTimeInvalid : null"
              ></BFormInput>
              <b-form-timepicker
                button-only
                right
                locale="en"
                id="start_time"
                :placeholder="$trans('Set time')"
                :hour12="false"
                :state="isSubmitClicked ? !startTimeInvalid : null"
              ></b-form-timepicker>
              <b-form-invalid-feedback :state="isSubmitClicked ? !startTimeInvalid : null">
                {{ $trans("Please enter a valid start time HH:mm") }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>
          <div class="flex-columns">
            <BFormGroup :label="$trans('End date')" label-for="end_date" cols="4">
              <VueDatePicker
                id="end_date"
                class=""
                v-model="leave.end_date"
                :placeholder="$trans('Select date')"
                value="leave.end_date"
                locale="nl"
                @input="() => loadTotals(leave)"
                :state="isSubmitClicked ? !v$.leave.end_date.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></VueDatePicker>
              <b-form-invalid-feedback :state="isSubmitClicked ? !v$.leave.end_date.$error : null">
                {{ $trans("Please enter a end date") }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup :label="$trans('Whole day')" cols="4">
              <BFormCheckbox
                id="leave_end_date_is_whole_day"
                v-model="leave.end_date_is_whole_day"
                name="leave_end_date_is_whole_day"
              ></BFormCheckbox>
            </BFormGroup>
            <BFormGroup
              v-if="!leave.end_date_is_whole_day"
              label-class=""
              :label="$trans('End time')"
              label-for="end_time"
              cols="4"
            >
              <BFormInput
                id="end_time"
                v-model="leave.end_time"
                type="text"
                placeholder="HH:mm"
                @input="endTimeChanged"
                :state="isSubmitClicked ? !endTimeInvalid : null"
              ></BFormInput>
              <b-form-timepicker
                button-only
                right
                locale="en"
                id="end_time"
                :placeholder="$trans('Set time')"
                :hour12="false"
                :state="isSubmitClicked ? !endTimeInvalid : null"
              ></b-form-timepicker>
              <b-form-invalid-feedback :state="isSubmitClicked ? !endTimeInvalid : null">
                {{ $trans("Please enter a valid end time HH:mm") }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>
          <b-overlay :show="loadingTotals" rounded="sm">
            <div class="flex-columns">
              <BFormGroup
                label-class=""
                :label="$trans('Total time')"
                label-for="totla_time"
                cols="4"
              >
                <BFormInput
                  id="total_time"
                  v-model="leave.total_time"
                  placeholder="Total time"
                  :readonly="true"
                ></BFormInput>
              </BFormGroup>
            </div>
          </b-overlay>
        </div>
      </div>
    </b-overlay>
  </div>
</template>
<script>
import moment from "moment";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { UserLeaveHoursService } from "@/models/company/UserLeaveHours.js";
import { LeaveTypeService } from "@/models/company/LeaveType.js";
import { UserListService } from "@/models/company/UserList.js";
import Multiselect from 'vue-multiselect'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import {useMainStore} from "@/stores/main";

const isCorrectTime = value => {
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
};

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    return {
      v$: useVuelidate(),
      create,
      mainStore
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
        leave_type: {
          required
        },
        user: {
          required
        },
        start_date: {
          required
        },
        end_date: {
          required
        }
      }
    };
  },
  data() {
    return {
      leaveHoursService: new UserLeaveHoursService(),
      leaveTypeService: new LeaveTypeService(),
      userListService: new UserListService(),
      isLoading: false,
      loadingTotals: false,
      submitClicked: false,
      compLoading: false,
      users: [],
      userName: "",
      getUsersDebounced: null,
      leave: {
        user: "",
        leave_type: "",
        start_date: moment().format("YYYY-MM-DD"),
        end_date: moment().format("YYYY-MM-DD"),
        start_date_is_whole_day: true,
        end_date_is_whole_day: true,
        start_time: moment().format("HH:mm"),
        end_time: moment().format("HH:mm")
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
    const lang = this.mainStore.getCurrentLanguage;
    this.$moment = moment;
    this.$moment.locale(lang);

    this.loadLeaveTypes();
    this.loadTotals(this.leave);
    if (!this.isCreate) {
      this.loadData();
    }
    this.getUsersDebounced = AwesomeDebouncePromise(this.getUsers, 500)
  },
  methods: {
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
    async submitForm() {
      this.startTimeInvalid = false;
      this.endTimeInvalid = false;
      this.submitClicked = true;
      this.v$.$touch();
      if (this.v$.$invalid) {
        console.log("invalid?", this.v$.$invalid);
        return;
      }

      if (!this.leave.start_date_is_whole_day && !isCorrectTime(this.leave.start_time)) {
        this.startTimeInvalid = true;
        return;
      }

      if (!this.leave.end_date_is_whole_day && !isCorrectTime(this.leave.end_time)) {
        this.endTimeInvalid = true;
        return;
      }

      this.isLoading = true;

      if (this.isCreate) {
        try {
          await this.leaveHoursService.insert(this.leave);
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
        await this.leaveHoursService.update(this.pk, this.leave);
        infoToast(this.create, $trans("Updated"), $trans("Leave has been updated"));
        this.isLoading = false;
        this.$router.go(-1);
      } catch (error) {
        console.log("Error updating leave", error);
        errorToast(this.create, $trans("Error updating leave"));
        this.isLoading = false;
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        this.leave = await this.leaveHoursService.detail(this.pk);
        this.leave.start_time = `${this.leave.start_date_hours}:${this.leave.start_date_minutes}`;
        this.leave.end_time = `${this.leave.end_date_hours}:${this.leave.end_date_minutes}`;
        this.leave.start_date = this.$moment(this.leave.start_date, "DD/MM/YYYY").format(
          "YYYY-MM-DD"
        );
        this.leave.end_date = this.$moment(this.leave.end_date, "DD/MM/YYYY").format("YYYY-MM-DD");
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching leave", error);
        errorToast(this.create, $trans("Error loading leave"));
        this.isLoading = false;
      }
    },
    async loadLeaveTypes() {
      this.isLoading = true;

      try {
        const data = await this.leaveTypeService.list();
        this.leaveTypes = data.results;
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching leave types", error);
        errorToast(this.create, $trans("Error loading leave types"));
        this.isLoading = false;
      }
    },
    async loadTotals(data) {
      this.loadingTotals = true;

      try {
        const result = await this.leaveHoursService.getTotals(data);
        this.loadingTotals = false;
        this.leave.total_time = this.humanize(result);
        console.log(result);
      } catch (error) {
        console.log("error fetching total", error);
        this.loadingTotals = false;
      }
    },
    startTimeChanged() {
      if (!isCorrectTime(this.leave.start_time)) return;
      const [hour, minute] = this.leave.start_time.split(":");
      this.leave.start_date_hours = hour;
      this.leave.start_date_minutes = minute;
      this.loadTotals(this.leave);
    },
    endTimeChanged() {
      if (!isCorrectTime(this.leave.end_time)) return;
      const [hour, minute] = this.leave.end_time.split(":");
      this.leave.end_date_hours = hour;
      this.leave.end_date_minutes = minute;
      this.loadTotals(this.leave);
    },
    cancelForm() {
      this.$router.go(-1);
    },
    humanize(result) {
      const hours = result.result.total_hours;
      const minutes = result.result.total_minutes;

      let humanReadableDuration = "";
      if (hours > 0) {
        humanReadableDuration += hours + " hour";
        if (hours > 1) humanReadableDuration += "s";
      }
      if (minutes > 0) {
        if (hours > 0) humanReadableDuration += " ";
        humanReadableDuration += minutes + " minute";
        if (minutes > 1) humanReadableDuration += "s";
      }
      return humanReadableDuration;
    }
  }
};
</script>
