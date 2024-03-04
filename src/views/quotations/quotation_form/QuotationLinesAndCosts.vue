<template>
<div>
  <MaterialsCreate
    :customer="customer"
    :chapter="chapter"
  />

  <Hours
    :chapter="chapter"
    :customer="customer"
    :type="COST_TYPE_WORK_HOURS"
  />

  <Hours
    :chapter="chapter"
    :customer="customer"
    :type="COST_TYPE_TRAVEL_HOURS"
  />

  <Distance
    :quotation_pk="quotation.id"
    :chapter="chapter"
    :customer="customer"
  />

  <CallOutCosts
    :chapter="chapter"
    :customer="customer"
  />

  <QuotationLine
    :chapter="chapter"
  />

</div>
</template>

<script>
import Distance from "@/views/quotations/quotation_form/Distance.vue";
import Hours from "@/views/quotations/quotation_form/Hours.vue";
import MaterialsCreate from "@/views/quotations/quotation_form/MaterialsCreate.vue";
import CallOutCosts from "@/views/quotations/quotation_form/CallOutCosts.vue";
import {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS
} from "@/models/orders/Cost";
import {QuotationModel} from "@/models/quotations/Quotation";
import {CustomerModel} from "@/models/customer/Customer";
import QuotationLine from "@/views/quotations/quotation_form/QuotationLine.vue";
import {ChapterModel} from "@/models/quotations/Chapter";

export default {
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
      COST_TYPE_EXTRA_WORK,
      COST_TYPE_ACTUAL_WORK,
    }
  }
}
</script>
<style scoped>

</style>
