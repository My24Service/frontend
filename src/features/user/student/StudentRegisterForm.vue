<template>
  <b-overlay :show="isPending" rounded="sm">
    <div class="container-fluid app-form">
      <b-container class="container-fluid">
        <div v-if="registered">
          <h3 class="register">{{ $trans('Registration complete') }}</h3>
          <p>{{ $trans('You will receive an email to activate your account') }}</p>
        </div>

        <b-form v-else>
          <ValidatedForm
            name="studentuser"
            v-model="values"
            :errors="errors"
            :messages="REGISTRATION_FIELD_MESSAGES"
            :labels="FIELD_LABELS"
            :submitted="submitClicked"
          >
            <h2 class="register">{{ $trans('Register') }}</h2>
            <b-row>
              <b-col cols="12" role="group">
                <ValidatedFormField name="email" />
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="6" role="group">
                <ValidatedFormField name="first_name" />
              </b-col>
              <b-col cols="6" role="group">
                <ValidatedFormField name="last_name" />
              </b-col>
            </b-row>
            <!-- The nested half of the form: the values live under
                 `student_user`, so this provider models the nested object and
                 names the path its errors are keyed under. -->
            <ValidatedForm
              name="studentuser"
              path="student_user"
              v-model="values.student_user"
              :errors="errors"
              :messages="REGISTRATION_FIELD_MESSAGES.student_user"
              :labels="FIELD_LABELS"
              :submitted="submitClicked"
            >
              <b-row>
                <b-col cols="12" role="group">
                  <ValidatedFormField name="mobile">
                    <small class="form-text text-muted">
                      {{ $trans('International notation (e.g. +316... for NL)') }}
                    </small>
                  </ValidatedFormField>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12" role="group">
                  <ValidatedFormField name="street" />
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="8" role="group">
                  <ValidatedFormField name="house_number">
                    <BFormInput
                      id="studentuser_house_number_addition"
                      size="sm"
                      v-model="values.student_user.house_number_addition"
                    ></BFormInput>
                  </ValidatedFormField>
                </b-col>
                <b-col cols="4" role="group">
                  <ValidatedFormField name="postal" />
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="8" role="group">
                  <ValidatedFormField name="city" />
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
                  <ValidatedFormField name="info" textarea rows="3" />
                </b-col>
              </b-row>
            </ValidatedForm>

            <div class="mx-auto">
              <footer class="modal-footer">
                <BButton @click="submitForm" :disabled="isPending" type="button" variant="primary">
                  {{ $trans('Register') }}
                </BButton>
              </footer>
            </div>
          </ValidatedForm>
        </b-form>
      </b-container>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { accountsRegisterCreateMutation } from '@/api/@tanstack/vue-query.gen'
import {
  ValidatedForm,
  ValidatedFormField,
} from '@/features/forms'
import { COUNTRY_OPTIONS } from './options'
import {
  emptyStudentRegistration,
  FIELD_LABELS,
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
