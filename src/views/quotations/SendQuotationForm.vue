<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-check-fill"></b-icon>
          <router-link :to="{ name: 'sent-quotations' }">
            {{ $trans("Send quotation") }}
          </router-link>
          /
          <strong>{{ $route.query.quotationName }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !offer.id">{{ $trans("new") }}</span>
            <span v-if="!isCreate && isEdit">{{ $trans("edit") }}</span>
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
                You must provide at least 1 email recipient
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
            </p>
          </div>
        </div>
      </div>
    </b-overlay>
  </div>
</template>
<script>
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { OfferService } from "@/models/quotations/offer.js";


export default {
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
      offer: {
        subject: {
          required
        }
      }
    };
  },
  async created() {
    await this.loadDocuments()
    if (!this.isCreate) {
      this.loadData();
    }
  },
  data() {
    return {
      isEdit: false,
      isSubmitClicked: false,
      offerService: new OfferService(),
      recipients: [],
      offer: {
        quotation: this.$route.query.quotationId
      },
      documents: [],
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
        this.template = await this.offerService.detail(this.pk);
        this.file = this.template.filename
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching customer template", error);
        this.errorToast(this.$trans("Error loading template"));
        this.isLoading = false;
      }
    },
    cancelForm() {
      this.$router.go(-1);
    },
    validateEmailRecipients(emails) {
      for (const email of emails) {
        if (!this.tagValidator(email)) return false
      }
      return emails.join(",")
    },
    async loadDocuments() {
      this.isLoading = true;

      try {
        const result = await this.offerService.getDocuments(
          this.$route.query.quotationId
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
        try {
          await this.offerService.insert(this.offer);
          this.infoToast(this.$trans("Sent"), this.$trans("Quotation have been sent to"));
          this.isLoading = false;
          this.$router.go(-1);
        } catch (error) {
          console.log("Error sending quotation", error);
          this.errorToast(this.$trans("Error sending quotation"));
          this.isLoading = false;
        }
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
</style>
