<template>
  <b-overlay :show="isPending" rounded="sm">
    <div class="container-fluid app-form">
      <b-container class="container-fluid">
        <div v-if="registered">
          <h3 class="register">{{ $trans('Registration complete') }}</h3>
          <p>{{ $trans('You will receive an email to activate your account') }}</p>
        </div>

        <b-form v-else>
          <h2 class="register">{{ $trans('Register') }}</h2>
          <b-row>
            <b-col cols="12" role="group">
              <ValidatedFormField
                id="studentuser_email"
                :label="$trans('Email')"
                v-model="values.email"
                :error="errors.email"
                :placeholder="REGISTRATION_FIELD_MESSAGES.email()"
                :submitted="submitClicked"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="6" role="group">
              <ValidatedFormField
                id="studentuser_first_name"
                :label="$trans('First name')"
                v-model="values.first_name"
                :error="errors.first_name"
                :placeholder="REGISTRATION_FIELD_MESSAGES.first_name()"
                :submitted="submitClicked"
              />
            </b-col>
            <b-col cols="6" role="group">
              <ValidatedFormField
                id="studentuser_last_name"
                :label="$trans('Last name')"
                v-model="values.last_name"
                :error="errors.last_name"
                :placeholder="REGISTRATION_FIELD_MESSAGES.last_name()"
                :submitted="submitClicked"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" role="group">
              <ValidatedFormField
                id="studentuser_mobile"
                :label="$trans('Mobile')"
                v-model="values.student_user.mobile"
                :error="errors.mobile"
                :placeholder="REGISTRATION_FIELD_MESSAGES.student_user.mobile()"
                :submitted="submitClicked"
              >
                <small class="form-text text-muted">
                  {{ $trans('International notation (e.g. +316... for NL)') }}
                </small>
              </ValidatedFormField>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" role="group">
              <ValidatedFormField
                id="studentuser_street"
                :label="$trans('Street')"
                v-model="values.student_user.street"
                :error="errors.street"
                :placeholder="REGISTRATION_FIELD_MESSAGES.student_user.street()"
                :submitted="submitClicked"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="8" role="group">
              <ValidatedFormField
                id="studentuser_house_number"
                :label="$trans('House nr./addition')"
                v-model="values.student_user.house_number"
                :error="errors.house_number"
                :placeholder="REGISTRATION_FIELD_MESSAGES.student_user.house_number()"
                :submitted="submitClicked"
              >
                <BFormInput
                  id="studentuser_house_number_addition"
                  size="sm"
                  v-model="values.student_user.house_number_addition"
                ></BFormInput>
              </ValidatedFormField>
            </b-col>
            <b-col cols="4" role="group">
              <ValidatedFormField
                id="studentuser_postal"
                :label="$trans('Postal')"
                v-model="values.student_user.postal"
                :error="errors.postal"
                :placeholder="REGISTRATION_FIELD_MESSAGES.student_user.postal()"
                :submitted="submitClicked"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="8" role="group">
              <ValidatedFormField
                id="studentuser_city"
                :label="$trans('City')"
                v-model="values.student_user.city"
                :error="errors.city"
                :placeholder="REGISTRATION_FIELD_MESSAGES.student_user.city()"
                :submitted="submitClicked"
              />
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                :label="$trans('Country')"
                label-for="studentuser_country_code"
              >
                <BFormSelect
                  id="studentuser_country_code"
                  v-model="values.student_user.country_code"
                  :options="COUNTRY_OPTIONS"
                  size="sm"
                ></BFormSelect>
              </BFormGroup>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" role="group">
              <ValidatedFormField
                id="studentuser_info"
                :label="$trans('Tell something about yourself')"
                v-model="values.student_user.info"
                textarea
                rows="3"
                :error="errors.info"
                :placeholder="REGISTRATION_FIELD_MESSAGES.student_user.info()"
                :submitted="submitClicked"
              />
            </b-col>
          </b-row>

          <div class="mx-auto">
            <footer class="modal-footer">
              <BButton @click="submitForm" :disabled="isPending" type="button" variant="primary">
                {{ $trans('Register') }}
              </BButton>
            </footer>
          </div>
        </b-form>
      </b-container>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import { accountsRegisterCreateMutation } from '@/api/@tanstack/vue-query.gen'
import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'
import { errorToast, infoToast, $trans } from '@/services/i18n'

import { COUNTRY_OPTIONS } from './options'
import {
  emptyStudentRegistration,
  parseStudentRegistration,
  REGISTRATION_FIELD_MESSAGES,
  validateStudentRegistration,
  type StudentRegistrationErrors,
} from './registration'

const { create } = useToast()

const values = ref(emptyStudentRegistration())
const errors = ref<StudentRegistrationErrors>({})
const submitClicked = ref(false)
const registered = ref(false)

const registerMutation = useMutation(accountsRegisterCreateMutation())

const isPending = computed(() => registerMutation.isPending.value)

async function submitForm() {
  if (registerMutation.isPending.value) return

  submitClicked.value = true

  const found = validateStudentRegistration(values.value)
  errors.value = found
  if (Object.keys(found).length > 0) return

  try {
    await registerMutation.mutateAsync({ body: parseStudentRegistration(values.value) })
    infoToast(create, $trans('Registered'), $trans('Registration success'))
    registered.value = true
  } catch (error) {
    console.log('Error registering student user', error)
    errorToast(create, $trans('Error registering'))
  }
}
</script>

<style scoped>
.register {
  padding-top: 20px;
}
</style>
