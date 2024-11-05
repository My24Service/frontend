<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-check-fill"></b-icon>
          <router-link :to="{ name: 'quotations-sent' }">
            {{ $trans("Send quotation") }}
          </router-link>
          /
          <router-link :to="{name: 'quotation-view', params: {pk: quotation.id}}">
            <strong>{{ quotation.quotation_name }}</strong>
          </router-link>
          <span class="dimmed">
            <span v-if="isCreate && !offer.id">{{ $trans("new") }}</span>
            <span v-if="!isCreate">{{ $trans("resend") }}</span>
          </span>
        </h3>
        <div class="flex-columns">
          <b-button @click="cancelForm" type="button" variant="secondary">
            {{ $trans("Cancel") }}</b-button
          >
          <b-button @click="submitForm" type="button" variant="primary">
            {{ $trans("Submit") }}</b-button
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
            <b-form-group
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
            </b-form-group>
            <b-form-group
              v-bind:label="$trans('Subject')"
              label-for="offer_subject"
              label-cols="3">
              <b-form-input
                autofocus
                id="offer_subject"
                size="sm"
                v-model="offer.subject"
                :state="isSubmitClicked ? !v$.offer.subject.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback :state="isSubmitClicked ? !v$.offer.subject.$error : null">
                {{ $trans("Please enter the email subject") }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-cols="3"
              v-bind:label="$trans('Body')"
              label-for="offer_body"
            >
              <b-form-textarea
                id="offer_body"
                v-model="offer.body"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
            <h6>{{ $trans("Attachments") }}</h6>
            <p v-if="!documents.length">
              {{ $trans("No attached documents to this quotation") }}
            </p>
            <p v-for="document in documents" :key="document.id">
              {{ document.name }}
              <b-button
                class="btn button btn-danger quotation-pdf-button"
                @click="downloadPdf"
                v-if="document.is_pdf"
                :disabled="loadingPdf"
              >
                <b-spinner small v-if="loadingPdf"></b-spinner>
                {{ $trans('Preview quotation pdf') }}
              </b-button>
            </p>
          </div>
        </div>
      </div>
    </b-overlay>
  </div>
</template>
<script>
import my24 from '../../services/my24.js'
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { OfferService, OfferModel } from "@/models/quotations/Offer.js";
import {QuotationService, QuotationModel} from '@/models/quotations/Quotation'


export default {
  setup() {
    return { v$: useVuelidate() };
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
    this.offer.quotation = this.$route.query.quotationId
    await this.loadDocuments()
    await this.loadData()
    await this.loadQuotation()
  },
  data() {
    return {
      isEdit: false,
      isLoading: false,
      loadingPdf: false,
      isSubmitClicked: false,
      quotationService: new QuotationService(),
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
    async loadData() {
      this.isLoading = true;

      try {
        this.offer = await this.offerService.getUnsentOffer(this.offer.quotation);
        this.offer.quotation = this.$route.query.quotationId
        this.recipients = this.offer.recipients.split(",")
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching unsent offer", error);
        this.errorToast(this.$trans("Error fetching unsent offer"));
        this.isLoading = false;
      }
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
    async loadQuotation() {
      this.isLoading = true

      try {
        this.quotation = new QuotationModel(
          await this.quotationService.detail(this.$route.query.quotationId)
        )
        if (!this.recipients.includes(this.quotation.quotation_email)) {
          this.recipients.push(this.quotation.quotation_email)
        }
        this.isLoading = false
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error fetching quotation'))
        this.isLoading = false
      }
    },
    async loadDocuments() {
      this.isLoading = true;

      try {
        const result = await this.offerService.getDocuments(
          this.offer.quotation
        );
        this.documents = result
        this.isLoading = false;
      } catch (error) {
        console.log("Error fetching documents", error);
        this.errorToast(this.$trans("Error fetching documents"));
        this.isLoading = false;
      }
    },
    async submitForm() {
      this.isSubmitClicked = true;
      this.recipientInvalid = true;
      this.v$.$touch();
      if (this.v$.$invalid) {
        console.log("invalid?", this.v$.$invalid);
        return;
      }

      let validatedEmails = this.validateEmailRecipients(this.recipients)

      if (!validatedEmails) {
        this.recipientInvalid = true
        return
      }

      this.offer.recipients = validatedEmails
      this.isLoading = true;

      if (this.isCreate) {
        this.offer.quotation = this.$route.query.quotationId
        try {
          this.offer = await this.offerService.insert(this.offer);
          this.isLoading = false;

          if (!this.offer.is_sent) {
            this.errorToast(this.$trans("Error sending quotation"));
            return;
          } else {
            this.infoToast(this.$trans("Sent"), this.$trans("Quotation have been sent"));
          }
          this.$router.go(-1);
          this.$router.push({name: 'quotations-sent'});
        } catch (error) {
          console.log("Error sending quotation", error);
          this.errorToast(this.$trans("Error sending quotation"));
          this.isLoading = false;
        }
        return
      }

      try {
        this.offer = await this.offerService.update(
          this.offer.id, this.offer
        )

        this.isLoading = false
        if (!this.offer.is_sent) {
          this.errorToast(this.$trans("Error sending quotation"));
          return;
        } else {
          this.infoToast(this.$trans("Sent"), this.$trans("Quotation have been sent"));
        }
        this.$router.push({name: 'quotations-sent'});
      } catch(error) {
        console.log("Error sending quotation", error);
        this.errorToast(this.$trans("Error sending quotation"));
        this.isLoading = false;
      }
    },
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
.quotation-pdf-button {
  margin-left: 20px;
}
</style>
