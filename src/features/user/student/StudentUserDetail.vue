<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Student user details') }}</h3>
      <b-row>
        <b-col cols="6">
          <img
            v-if="profile.picture_url"
            class="profile-picture"
            :src="profile.picture_url"
            :alt="student.full_name"
          />
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
              <b-td>{{ student.full_name }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
              <b-td>{{ address }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Postal') }}</b-td>
              <b-td>{{ profile.postal }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('City') }}</b-td>
              <b-td>{{ profile.city }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Country') }}</b-td>
              <b-td>{{ profile.country_code }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Day of birth') }}</b-td>
              <b-td>{{ profile.dob }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Mobile') }}</b-td>
              <b-td>{{ profile.mobile }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Email') }}</b-td>
              <b-td>{{ student.email }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('IBAN') }}</b-td>
              <b-td>{{ profile.iban }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('BSN') }}</b-td>
              <b-td>{{ profile.bsn }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Gender') }}</b-td>
              <b-td>{{ profile.gender }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Drivers licence') }}</b-td>
              <b-td>{{ profile.drivers_licence }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Drivers licence type') }}</b-td>
              <b-td>{{ profile.drivers_licence_type }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Box truck?') }}</b-td>
              <b-td>{{ profile.box_truck }}</b-td>
            </b-tr>
            <b-tr>
              <b-td>{{ $trans('Info') }}</b-td>
              <b-td>{{ profile.info }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>
      <footer class="modal-footer">
        <BButton @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}
        </BButton>
      </footer>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { companyStudentuserRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import type { StudentSub, StudentUser } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms'
import { $trans } from '@/services/i18n'

const props = defineProps<{
  pk: string | number
}>()

const router = useRouter()

const detailQuery = useQuery(() => companyStudentuserRetrieveOptions({path: {id: Number(props.pk)}}))

useQueryErrorToast(detailQuery.error, $trans('Error loading studentuser'))

const isLoading = computed(() => detailQuery.isLoading.value)

const student = computed(() => detailQuery.data.value ?? ({} as Partial<StudentUser>))

// The profile fields ride under `student_user`; the legacy page read them off
// the top of the record and rendered every one of these rows blank.
const profile = computed(() => student.value.student_user ?? ({} as Partial<StudentSub>))

const address = computed(() =>
  [profile.value.street, profile.value.house_number, profile.value.house_number_addition]
    .filter((part) => part)
    .join(' '),
)

function goBack() {
  router.push({name: 'users-studentusers'})
}
</script>

<style scoped>
img.profile-picture {
  width: 100%;
}
</style>
