<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-check-fill"></b-icon>{{ $trans("Leave Types") }}</h3>
        <div class="flex-columns">
          <b-button @click="addNewLeave" type="button" variant="primary">
            <b-icon icon="file-earmark-plus"></b-icon>
            {{ $trans("Add leave types") }}
          </b-button>
        </div>
      </div>
    </header>
    <div class="panel overflow-auto">
      <SubNav />
      <b-table
        small
        id="leave-table"
        :busy="isLoading"
        :fields="fields"
        :items="leaveTypes"
        responsive="md"
        class="data-table"
      >
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner><br /><br />
            <strong>{{ $trans("loading leave types list...") }}</strong>
          </div>
        </template>
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkRefresh
                  v-bind:method="
                    function() {
                      leaveTypeService.searchQuery = null
                      loadData();
                    }
                  "
                  v-bind:title="$trans('Refresh')"
                />
                <ButtonLinkSearch
                  v-bind:method="
                    function() {
                      showSearchModal();
                    }
                  "
                />
              </b-button-group>
            </b-button-toolbar>
          </div>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <b-icon-pencil class="edit-icon" @click="() => editLeaveType(data.item)">
            </b-icon-pencil>
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="
                function() {
                  showDeleteModal(data.item.id);
                }
              "
            />
          </div>
        </template>
      </b-table>
    </div>
    <Pagination
      v-if="!isLoading"
      :model="this.leaveTypeService"
      :model_name="$trans('Leave types')"
    />
    <SearchModal id="search-modal" ref="search-modal" @do-search="handleSearchOk" />
    <b-modal
      id="delete-leave-modal"
      ref="delete-leave-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans("Are you sure you want to delete this leave type?") }}</p>
    </b-modal>
    <b-modal
      id="add-edit-leave-type-modal"
      ref="add-edit-leave-type-modal"
      v-bind:title="leaveTypeFormText"
      @ok="submitLeaveTypeForm"
      @hidden="resetLeaveTypeForm"
    >
      <b-overlay :show="isLoadingForm" rounded="sm">
        <div class="flex-columns">
          <b-form-group label-class="" :label="$trans('Name')" label-for="name" cols="4">
            <b-form-input
              id="name"
              v-model="leaveTypeForm.name"
              placeholder="Name"
              :state="submitClicked ? !v$.leaveTypeForm.name.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback :state="submitClicked ? !v$.leaveTypeForm.name.$error : null">
              {{ $trans("Please enter a leave type name") }}
            </b-form-invalid-feedback>
          </b-form-group>
          <b-form-group :label="$trans('Counts as leave')" cols="4">
            <b-form-checkbox
              id="count_as_leave"
              v-model="leaveTypeForm.counts_as_leave"
              name="count_as_leave"
            ></b-form-checkbox>
          </b-form-group>
        </div>
      </b-overlay>
    </b-modal>
  </div>
</template>

<script>
import IconLinkDelete from "../../../components/IconLinkDelete.vue";
import ButtonLinkRefresh from "../../../components/ButtonLinkRefresh.vue";
import ButtonLinkSearch from "../../../components/ButtonLinkSearch.vue";
import ButtonLinkAdd from "../../../components/ButtonLinkAdd.vue";
import SearchModal from "../../../components/SearchModal.vue";
import Pagination from "../../../components/Pagination.vue";
import SubNav from "./SubNav.vue";
import { LeaveTypeService } from "@/models/company/LeaveType.js";
import IconLinkEdit from "../../../components/IconLinkEdit.vue";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";

export default {
  setup() {
    return { v$: useVuelidate() };
  },
  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
    SubNav,
    IconLinkEdit
  },
  computed: {
    leaveTypeFormText() {
      return this.leaveTypePk ? this.$trans("Update leave type") : this.$trans("Create leave type");
    }
  },
  validations() {
    return {
      leaveTypeForm: {
        name: {
          required
        }
      }
    };
  },
  data() {
    return {
      leaveTypeService: new LeaveTypeService(),
      searchQuery: null,
      leaveTypePk: null,
      isLoading: false,
      isLoadingForm: false,
      submitClicked: false,
      leaveTypes: [],
      leaveTypeForm: {
        name: "",
        counts_as_leave: true
      },
      fields: [
        { key: "name", label: this.$trans("Name"), thAttr: { width: "15%" } },
        { key: "icons", thAttr: { width: "15%" } }
      ]
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs["search-modal"].hide();
      this.leaveTypeService.setSearchQuery(val);
      this.loadData();
    },
    showSearchModal() {
      this.$refs["search-modal"].show();
    },
    // delete
    showDeleteModal(id) {
      this.leaveTypePk = id;
      this.$refs["delete-leave-modal"].show();
    },
    addNewLeave() {
      this.leaveTypePk = "";
      this.$refs["add-edit-leave-type-modal"].show();
    },
    editLeaveType(data) {
      this.leaveTypePk = data.id;
      this.leaveTypeForm = { ...data };
      this.$refs["add-edit-leave-type-modal"].show();
    },
    resetLeaveTypeForm() {
      this.leaveTypeForm = {
        name: "",
        counts_as_leave: true
      };
      this.submitClicked = false;
    },
    async doDelete() {
      this.isLoading = true;
      try {
        await this.leaveTypeService.delete(this.leaveTypePk);
        infoToast(create, this.$trans("Deleted"), this.$trans("Leave type has been deleted"));
        this.loadData();
      } catch (error) {
        console.log("error deleting leave type", error);
        errorToast(create, this.$trans("Error deleting leave type"));
        this.isLoading = false;
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.leaveTypeService.list();
        this.leaveTypes = data.results;
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching leave types", error);
        errorToast(create, this.$trans("Error loading leave types"));
        this.isLoading = false;
      }
    },
    async submitLeaveTypeForm(bvModalEvent) {
      bvModalEvent.preventDefault();
      this.submitClicked = true;
      this.v$.$touch();
      if (this.v$.$invalid) {
        console.log("invalid?", this.v$.$invalid);
        return;
      }

      this.isLoadingForm = true;
      if (!this.leaveTypePk) {
        try {
          await this.leaveTypeService.insert(this.leaveTypeForm);
          infoToast(create, this.$trans("Created"), this.$trans("Leave type has been created"));
          this.isLoadingForm = false;
          this.$nextTick(() => {
            this.$bvModal.hide("add-edit-leave-type-modal");
            this.loadData();
          });
        } catch (error) {
          console.log("Error creating leave types", error);
          errorToast(create, this.$trans("Error creating leave types"));
          this.isLoadingForm = false;
        }

        return;
      }

      try {
        await this.leaveTypeService.update(this.leaveTypePk, this.leaveTypeForm);
        infoToast(create, this.$trans("Updated"), this.$trans("Leave type has been updated"));
        this.isLoadingForm = false;
        this.$nextTick(() => {
          this.$bvModal.hide("add-edit-leave-type-modal");
          this.loadData();
        });
      } catch (error) {
        console.log("Error updating leave type", error);
        errorToast(create, this.$trans("Error updating leave type"));
        this.isLoadingForm = false;
      }
      this.resetLeaveTypeForm();
    }
  }
};
</script>
<style scoped>
.color_text {
  font-weight: bold;
  font-style: italic;
}
.subnav-pills {
  margin-bottom: 20px;
}
.edit-icon {
  color: #ff9933;
}
.edit-icon:hover {
  cursor: pointer;
}
</style>
