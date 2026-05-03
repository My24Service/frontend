<template>
  <b-overlay
    :show="isLoading"
    rounded="sm"
    class="status"
    :title="model.last_status_full"
  >
    <IBiCircleFill
      class="color-icon"
      v-bind:style="`color:${statusColorCode}`"
      :title="model.last_status_full"
    ></IBiCircleFill>
    <BFormSelect
      v-if="statuscodes.length"
      :title="statusCodeComputed.statuscode"
      :id="model.id + '-change-status'"
      v-model="statusCodeModel"
      :options="statuscodes"
      size="sm"
      value-field="statuscode"
      text-field="statuscode"
      style="border-color: transparent;"
      @change="handleStatusChange(model.id, $event)"
    ></BFormSelect>
  </b-overlay>
</template>
<script>
import my24 from '@/services/my24.js'
import {errorToast} from "@/utils";
import componentMixin from "@/mixins/common";
import {useToast} from "bootstrap-vue-next";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create,
    }
  },
  mixins: [componentMixin],
  props: {
    statusCodeService: {
      type: Object,
      default: () => {}
    },
    statusService: {
      type: Object,
      default: () => {}
    },
    model: {
      type: Object,
      default: () => {}
    },
    modelName: {
      type: String,
      default: ""
    },
    statuscodes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return{
      statusCodeModel: null,
      statusColorCode: null,
      isLoading: false
    }
  },
  computed: {
    statusCodeComputed() {
      let statusCode = my24.getStatuscode(this.statuscodes, this.model.last_status);
      if (statusCode) {
        return statusCode.statuscode;
      }
      return {}
    }
  },
  async created() {
    this.statusCodeModel = this.statusCodeComputed
    this.statusColorCode = my24.status2color(this.statuscodes, this.statusCodeModel);
  },
  methods: {
    handleStatusChange(id, value) {
      this.changeStatus(id, value);
      this.statusColorCode = my24.status2color(this.statuscodes, value);
    },
    async changeStatus(id, value) {
      const status = {
        [this.modelName]: id,
        status: value
      }
      console.log(status)
      try {
        await this.statusService.insert(status)
      } catch(error) {
        console.log('Error creating status', error)
        errorToast(this.create, this.$trans('Error creating status'))
      }
    }
  },
  watch: {
    statuscodes: {
      handler(newVal, oldVal) {
        this.statusCodeModel = this.statusCodeComputed
        this.statusColorCode = my24.status2color(this.statuscodes, this.statusCodeModel);
      },
      deep: true
    }
  }
}
</script>
<style scoped>
.status {
  display: flex;
  align-items: center;
  width: 80%;
}
.color-icon {
 margin-right: 10px;
}
</style>
