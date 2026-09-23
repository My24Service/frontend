<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
          <router-link :to="{ name: 'quotations-sent' }">
            {{ $trans("Send quotation") }}
          </router-link>
          /
          <strong>{{ quotation.quotation_id }} {{ quotation.quotation_name }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !offer.id">{{ $trans("new") }}</span>
            <span v-if="!isCreate">{{ $trans("resend") }}</span>
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
      <div class="page-detail">
        <div class="flex-columns">
          <div class="panel">
            <p class="text-center">
              <strong><i>{{ $trans("Quotations can't be changed after having been sent") }}</i></strong>
            </p>
            <h6>{{ $trans("Email") }}</h6>
            <BFormGroup
              :label="$trans('Email recipients')"
              label-for="tags-validation"
              :state="isSubmitClicked ? !recipientInvalid : null"
            >
              <b-form-tags
                input-id="tags-validation"
                v-model="recipients"
                :tag-validator="tagValidator"
                :state="isSubmitClicked ? !recipientInvalid : null"
                :placeholder="$trans('Input the email address and press space')"
                :invalid-tag-text="$trans('Invalid email address')"
                :duplicate-tag-text="$trans('Duplicate email')"
                tag-variant="primary"
                separator=" "
              ></b-form-tags>
              <template #invalid-feedback>
                {{ $trans("You must provide at least 1 email recipient") }}
              </template>
            </BFormGroup>
            <BFormGroup
              v-bind:label="$trans('Subject')"
              label-for="offer_subject"
              label-cols="3">
              <BFormInput
                autofocus
                id="offer_subject"
                size="sm"
                v-model="offer.subject"
                :state="isSubmitClicked ? !v$.offer.subject.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback :state="isSubmitClicked ? !v$.offer.subject.$error : null">
                {{ $trans("Please enter the email subject") }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup
              label-cols="3"
              v-bind:label="$trans('Body')"
              label-for="offer_body"
            >
              <BFormTextarea
                id="offer_body"
                v-model="offer.body"
                rows="3"
              ></BFormTextarea>
            </BFormGroup>
            <h6>{{ $trans("Attachments") }}</h6>
            <p v-if="!documents.length">
              {{ $trans("No attached documents to this quotation") }}
            </p>
            <p v-for="document in documents" :key="document.id">
              {{ document.name }}
              <BButton
                class="btn button btn-danger quotation-pdf-button"
                @click="downloadPdf"
                v-if="document.is_pdf"
                :disabled="loadingPdf"
              >
                <b-spinner small v-if="loadingPdf"></b-spinner>
                {{ $trans('Preview quotation PDF') }}
              </BButton>
            </p>
          </div>
        </div>
      </div>
    </b-overlay>
  </div>
</template>
<script>
import {useVuelidate} from "@vuelidate/core";
import {required} from "@vuelidate/validators";

import {OfferModel, OfferService} from "@/models/quotations/Offer.js";

export default {
  setup() {
    const {create} = useToast()
    return {
      v$: useVuelidate(),
      create
    }
  },
  computed: {
    isCreate() {
      return !this.offer.id;
    }
  },
  validations() {
    return {
      offer: {
        subject: {
          required
        }
      }
    };
  },
  async mounted() {
    await this.loadData()
  },
  data() {
    return {
      isEdit: false,
      isLoading: false,
      loadingPdf: false,
      isSubmitClicked: false,
      offerService: new OfferService(),
      recipients: [],
      offer: new OfferModel({}),
      documents: [],
      quotation: {},
      recipientInvalid: false,
    };
  },
  methods: {
    tagValidator(tag) {
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(tag)
    },
    /**
     * The unsent offer if there is one, else a new one, with the quotation it
     * is for and the files it goes out with - all in one answer.
     */
    async loadData() {
      this.isLoading = true;

      try {
        const {offer, quotation, documents} = await this.offerService.getUnsentOffer(this.$route.query.quotationId);
        this.offer = offer ?? new OfferModel({})
        this.offer.quotation = quotation.id
        this.quotation = quotation
        this.documents = documents
        this.recipients = this.offer.recipients ? this.offer.recipients.split(",") : []
        if (quotation.quotation_email && !this.recipients.includes(quotation.quotation_email)) {
          this.recipients.push(quotation.quotation_email)
        }
      } catch (error) {
        console.log("error fetching unsent offer", error);
        errorToast(this.create, $trans("Error fetching unsent offer"));
      }
      this.isLoading = false;
    },
    cancelForm() {
      this.$router.go(-1)
    },
    validateEmailRecipients(emails) {
      for (const email of emails) {
        if (!this.tagValidator(email)) return false
      }
      return emails.join(",")
    },
    async downloadPdf() {
      const url =  `/api/quotation/quotation/${this.offer.quotation}/download_definitive_pdf/`
      this.loadingPdf = true;

      my24.downloadItem(
        url,
        'quotation.pdf',
        function() {
          this.loadingPdf = false;
        }.bind(this),
        'post'
      )
    },
    async submitForm() {
      this.isSubmitClicked = true;
      this.recipientInvalid = false;
      this.v$.$touch();
      if (this.v$.$invalid) {
        console.log("invalid?", this.v$.$errors);
        return;
      }

      let validatedEmails = this.validateEmailRecipients(this.recipients)

      if (!validatedEmails) {
        this.recipientInvalid = true
        return
      }

      this.offer.recipients = validatedEmails
      this.isLoading = true;
      const errorBody = $trans("Error sending quotation")

      try {
        this.offer = this.isCreate
          ? await this.offerService.insert(this.offer)
          : await this.offerService.update(this.offer.id, this.offer)
        this.isLoading = false

        if (!this.offer.is_sent) {
          errorToast(this.create, errorBody);
          return;
        }
        infoToast(this.create, $trans("Sent"), $trans("Quotation has been sent"));
        await this.$router.push({name: 'quotations-sent'});
      } catch (error) {
        console.log("Error sending quotation", error);
        errorToast(this.create, errorBody);
        this.isLoading = false;
      }
    },
  }
};
</script>
<style scoped>
.quotation-pdf-button {
  margin-left: 20px;
}
</style>
