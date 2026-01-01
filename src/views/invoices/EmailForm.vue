<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-check-fill"></b-icon>
          <router-link :to="{ name: 'invoices-sent' }">
            {{ $trans("Send invoice") }}
          </router-link>
          /
          <strong>{{ invoice.invoice_id }}</strong>

          <span class="dimmed">
            <span v-if="isCreate && !email.id">{{ $trans("new") }}</span>
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
              label-for="email_subject"
              label-cols="3">
              <b-form-input
                autofocus
                id="email_subject"
                size="sm"
                v-model="email.subject"
                :state="isSubmitClicked ? !v$.email.subject.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback :state="isSubmitClicked ? !v$.email.subject.$error : null">
                {{ $trans("Please enter the email subject") }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-cols="3"
              v-bind:label="$trans('Body')"
              label-for="email_body"
            >
              <b-form-textarea
                id="email_body"
                v-model="email.body"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
            <h6>{{ $trans("Attachments") }}</h6>
            <p v-if="!documents.length">
              {{ $trans("No attached documents to this invoice") }}
            </p>
            <p v-for="document in documents" :key="document.id">
              {{ document.name }}
              <b-button
                class="btn button btn-danger invoice-pdf-button"
                @click="downloadPdf"
                v-if="document.is_pdf"
                :disabled="loadingPdf"
              >
                <b-spinner small v-if="loadingPdf"></b-spinner>
                {{ $trans('Preview invoice PDF') }}
              </b-button>
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

import my24 from '@/services/my24.js'

import { EmailService, EmailModel } from "@/models/invoices/Email.js";
import { InvoiceService, InvoiceModel } from '@/models/invoices/Invoice'
import {OrderService} from "@/models/orders/Order";
import {CustomerModel, CustomerService} from "@/models/customer/Customer";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() };
  },
  computed: {
    isCreate() {
      return !this.email.id;
    }
  },
  validations() {
    return {
      email: {
        subject: {
          required
        }
      }
    };
  },
  async mounted() {
    this.email.invoice = this.$route.query.invoiceId
    await this.loadDocuments()
    await this.loadData()
    await this.loadInvoice()
  },
  data() {
    return {
      isEdit: false,
      isLoading: false,
      loadingPdf: false,
      isSubmitClicked: false,
      invoiceService: new InvoiceService(),
      emailService: new EmailService(),
      orderService: new OrderService(),
      customerService: new CustomerService(),
      recipients: [],
      email: new EmailModel({}),
      documents: [],
      invoice: {},
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
        this.email = await this.emailService.getUnsentEmail(this.email.invoice);
        this.email.invoice = this.$route.query.invoiceId
        this.recipients = this.email.recipients.split(",")
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching unsent email", error);
        errorToast(create, this.$trans("Error fetching unsent email"));
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
      const url =  `/api/invoice/invoice/${this.email.invoice}/download_pdf/`
      this.loadingPdf = true;

      my24.downloadItem(
        url,
        'invoice.pdf',
        function() {
          this.loadingPdf = false;
        }.bind(this),
        'post'
      )
    },
    async loadInvoice() {
      this.isLoading = true

      try {
        this.invoice = new InvoiceModel(
          await this.invoiceService.detail(this.$route.query.invoiceId)
        )
        if (!this.recipients.includes(this.invoice.invoice_email)) {
          this.recipients.push(this.invoice.invoice_email)
        }

        const order = await this.orderService.detail(this.invoice.order)
        const customer = new CustomerModel(await this.customerService.detail(order.customer_relation))
        if (customer.email) {
          for (let address of customer.email.split(',')) {
            if (this.tagValidator(address)) {
              this.recipients.push(address)
            }
          }
        }

        this.isLoading = false
      } catch(error) {
        this.isLoading = false
        console.log('error fetching invoice', error)
        errorToast(create, this.$trans('Error fetching invoice'))
      }
    },
    async loadDocuments() {
      this.isLoading = true;

      try {
        this.documents = await this.emailService.getDocuments(
          this.email.invoice
        );
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        console.log("Error fetching documents", error);
        errorToast(create, this.$trans("Error fetching documents"));
      }
    },
    async submitForm() {
      this.isSubmitClicked = true;
      this.recipientInvalid = false;
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

      this.email.recipients = validatedEmails
      this.isLoading = true;
      const sentTitle = this.$trans("Sent")
      const sentBody = this.$trans("Invoice has been sent")
      const sendError = this.$trans("Error sending invoice")

      if (this.isCreate) {
        this.email.invoice = this.$route.query.invoiceId
        try {
          this.email = await this.emailService.insert(this.email);
          this.isLoading = false;

          if (!this.email.is_sent) {
            errorToast(create, sendError);
            return;
          }
          infoToast(create, sentTitle, sentBody);
          await this.$router.push({name: 'invoices-sent'});
        } catch (error) {
          console.log("Error sending invoice", error);
          this.isLoading = false;
          errorToast(create, sendError);
        }
        return
      }

      try {
        this.email = await this.emailService.update(
          this.email.id, this.email
        )

        this.isLoading = false
        if (!this.email.is_sent) {
          errorToast(create, sendError);
          return;
        }
        infoToast(create, sentTitle, sentBody);
        await this.$router.push({name: 'invoices-sent'});
      } catch(error) {
        console.log("Error sending invoice", error);
        this.isLoading = false;
        errorToast(create, sendError);
      }
    },
  }
};
</script>
<style scoped>
.invoice-pdf-button {
  margin-left: 20px;
}
</style>
