<template>
<div>
  <MaterialsCreate
    :customer="customer"
    :chapter="chapter"
    class="component-margin"
  />

  <Hours
    :chapter="chapter"
    :customer="customer"
    :type="COST_TYPE_WORK_HOURS"
    class="component-margin"
  />

  <Hours
    :chapter="chapter"
    :customer="customer"
    :type="COST_TYPE_TRAVEL_HOURS"
    class="component-margin"
  />

  <Distance
    :quotation_pk="quotation.id"
    :chapter="chapter"
    :customer="customer"
    class="component-margin"
  />

  <CallOutCosts
    :chapter="chapter"
    :customer="customer"
    class="component-margin"
  />

  <QuotationLine
    :chapter="chapter"
    v-if="false"
  />

  <footer
    class="modal-footer"
    v-if="false"
  >
    <b-button
      @click="saveChapter"
      class="btn btn-primary update-button"
      type="button"
      variant="primary"
    >
      {{ $trans('Save chapter') }}
    </b-button>
  </footer>

</div>
</template>

<script>
import Distance from "@/views/quotations/quotation_form/Distance.vue";
import Hours from "@/views/quotations/quotation_form/Hours.vue";
import MaterialsCreate from "@/views/quotations/quotation_form/MaterialsCreate.vue";
import CallOutCosts from "@/views/quotations/quotation_form/CallOutCosts.vue";
import {
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS
} from "@/models/orders/Cost";
import {QuotationModel} from "@/models/quotations/Quotation";
import {CustomerModel} from "@/models/customer/Customer";
import QuotationLine from "@/views/quotations/quotation_form/QuotationLine.vue";
import {ChapterModel} from "@/models/quotations/Chapter";

export default {
  name: 'QuotationLinesAndCosts',
  props: {
    quotation: {
      type: QuotationModel,
      default: null
    },
    customer: {
      type: CustomerModel,
      default: null
    },
    chapter: {
      type: ChapterModel,
      default: null
    },
  },
  components: {
    QuotationLine,
    MaterialsCreate,
    Hours,
    Distance,
    CallOutCosts
  },
  data() {
    return {
      COST_TYPE_WORK_HOURS,
      COST_TYPE_TRAVEL_HOURS,
      lines: [],
      materialsCosts: [],
      workhoursCosts: [],
      travelHoursCosts: [],
      distanceCosts: [],
      callOutCosts: [],
    }
  },
  methods: {
    saveChapter() {
      let chapter = {
        ...this.chapter,
        costs: this.costs,
        lines: this.lines
      }

      this.$emit('chapter-update', chapter)
    }
  }
}
</script>
<style scoped>
.component-margin {
  margin-bottom: 10px;
}
</style>
