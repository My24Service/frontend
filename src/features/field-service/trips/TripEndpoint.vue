<template>
  <b-col cols="6">
    <h3>{{ spec.title }}</h3>
    <b-row>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          v-bind:label="spec.datetimeLabel"
          :label-for="spec.datetimeId"
        >
          <BFormCheckbox
            :id="spec.datetimeId"
            v-model="values[spec.datetimeKey]"
          >
          </BFormCheckbox>
        </BFormGroup>
      </b-col>
      <b-col cols="4" role="group">
        <BFormGroup
          v-if="!values[spec.datetimeKey]"
          label-size="sm"
          label-class="p-sm-0"
          v-bind:label="spec.dateLabel"
          :label-for="spec.dateId"
        >
          <VueDatePicker
            :id="spec.dateId"
            size="sm"
            :class="spec.datePickerClass"
            v-model="values[spec.dateKey]"
            :placeholder="$trans('Choose a date')"
            :locale="nl"
            auto-apply
            arrow-navigation
            :formats="{ input: 'dd/MM/yyyy' }"
          ></VueDatePicker>
          <b-form-invalid-feedback :state="submitClicked ? !errors[spec.dateKey] : null">
            {{ errors[spec.dateKey] }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
      <b-col cols="4" role="group">
        <BFormGroup
          v-if="!values[spec.datetimeKey]"
          label-size="sm"
          label-class="p-sm-0"
          v-bind:label="spec.timeLabel"
          :label-for="spec.timeLabelFor"
        >
          <BFormInput
            :id="spec.timeId"
            size="sm"
            v-model="values[spec.timeKey]"
            :class="spec.timeInputClass"
            v-bind:placeholder="$trans('Choose a time')"
            :state="submitClicked ? !errors[spec.timeKey] : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="submitClicked ? !errors[spec.timeKey] : null">
            {{ errors[spec.timeKey] }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          v-bind:label="spec.locationLabel"
          :label-for="spec.locationId"
        >
          <BFormCheckbox
            :id="spec.locationId"
            v-model="values[spec.locationKey]"
          >
          </BFormCheckbox>
        </BFormGroup>
      </b-col>
      <b-col cols="3" role="group">
        <BFormGroup
          v-if="!values[spec.locationKey]"
          label-size="sm"
          v-bind:label="$trans('Location')"
          :label-for="spec.nameId"
        >
          <BFormInput
            v-model="values[spec.nameKey]"
            :id="spec.nameId"
            size="sm"
            :state="submitClicked ? !errors[spec.nameKey] : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="submitClicked ? !errors[spec.nameKey] : null">
            {{ errors[spec.nameKey] }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
      <b-col cols="5" role="group">
        <BFormGroup
          v-if="!values[spec.locationKey]"
          label-size="sm"
          v-bind:label="$trans('City')"
          :label-for="spec.cityId"
        >
          <BFormInput
            v-model="values[spec.cityKey]"
            :id="spec.cityId"
            size="sm"
            :state="submitClicked ? !errors[spec.cityKey] : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="submitClicked ? !errors[spec.cityKey] : null">
            {{ errors[spec.cityKey] }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="7" role="group">
        <BFormGroup
          v-if="!values[spec.locationKey]"
          label-size="sm"
          v-bind:label="$trans('Address')"
          :label-for="spec.addressId"
        >
          <BFormInput
            v-model="values[spec.addressKey]"
            :id="spec.addressId"
            size="sm"
            :state="submitClicked ? !errors[spec.addressKey] : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="submitClicked ? !errors[spec.addressKey] : null">
            {{ errors[spec.addressKey] }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
      <b-col cols="3" role="group">
        <BFormGroup
          v-if="!values[spec.locationKey]"
          label-size="sm"
          v-bind:label="$trans('Postal')"
          :label-for="spec.postalId"
        >
          <BFormInput
            v-model="values[spec.postalKey]"
            :id="spec.postalId"
            size="sm"
            :state="submitClicked ? !errors[spec.postalKey] : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="submitClicked ? !errors[spec.postalKey] : null">
            {{ errors[spec.postalKey] }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
      <b-col cols="2" role="group">
        <BFormGroup
          v-if="!values[spec.locationKey]"
          label-size="sm"
          v-bind:label="$trans('Country')"
          :label-for="spec.countryId"
        >
          <BFormSelect
            :id="spec.countryId"
            v-model="values[spec.countryKey]"
            :options="countries"
            size="sm"
          ></BFormSelect>
        </BFormGroup>
      </b-col>
    </b-row>
  </b-col>
</template>

<script setup lang="ts">
import { nl } from 'date-fns/locale'

import { $trans } from '@/services/i18n'
import type { TripFieldErrors, TripFormValues } from './schemas'

/**
 * One end of the trip: where it starts or where it ends, each with a
 * date/time block and a location block that fall back to the first/last job.
 *
 * The start and end blocks were a ~170-line mirror differing only in the
 * field they bind (`start_*` vs `end_*`, `*_from_first_order` vs
 * `*_from_last_order`), the copy around them, and two legacy quirks the spec
 * pins: the end date picker and end time input carry `mb-2` where the start's
 * carry `p-sm-0`/nothing, and the end time input's `id` (`end_time`) does not
 * match its label's `for` (`trip_end_time`). The `kind` prop picks the spec,
 * so the conditionals (`v-if` on the "from first/last job" boxes) are
 * single-sourced.
 */
const props = defineProps<{
  /** Which end this is: the fields, ids and copy follow from it. */
  kind: 'start' | 'end'
  errors: TripFieldErrors
  submitClicked: boolean
  countries: { value: string; text: string }[]
}>()

const values = defineModel<TripFormValues>({ required: true })

interface EndpointSpec {
  title: string
  datetimeKey: 'start_datetime_from_first_order' | 'end_datetime_from_last_order'
  datetimeId: string
  datetimeLabel: string
  dateKey: 'start_date' | 'end_date'
  dateId: string
  dateLabel: string
  datePickerClass: string
  timeKey: 'start_time' | 'end_time'
  timeId: string
  timeLabel: string
  timeLabelFor: string
  timeInputClass?: string
  locationKey: 'start_location_from_first_order' | 'end_location_from_last_order'
  locationId: string
  locationLabel: string
  nameKey: 'start_name' | 'end_name'
  nameId: string
  cityKey: 'start_city' | 'end_city'
  cityId: string
  addressKey: 'start_address' | 'end_address'
  addressId: string
  postalKey: 'start_postal' | 'end_postal'
  postalId: string
  countryKey: 'start_country_code' | 'end_country_code'
  countryId: string
}

const spec = computed<EndpointSpec>(() => (props.kind === 'start'
  ? {
    title: $trans('Start'),
    datetimeKey: 'start_datetime_from_first_order',
    datetimeId: 'start_datetime_from_first_order',
    datetimeLabel: $trans('Date/time from first job?'),
    dateKey: 'start_date',
    dateId: 'trip_start_date',
    dateLabel: $trans('Start date'),
    datePickerClass: 'p-sm-0',
    timeKey: 'start_time',
    timeId: 'trip_start_time',
    timeLabel: $trans('Start time'),
    timeLabelFor: 'trip_start_time',
    timeInputClass: undefined,
    locationKey: 'start_location_from_first_order',
    locationId: 'start_location_from_first_order',
    locationLabel: $trans('Location from first job?'),
    nameKey: 'start_name',
    nameId: 'trip_start_name',
    cityKey: 'start_city',
    cityId: 'trip_start_city',
    addressKey: 'start_address',
    addressId: 'trip_start_address',
    postalKey: 'start_postal',
    postalId: 'trip_start_postal',
    countryKey: 'start_country_code',
    countryId: 'start_country_code',
  }
  : {
    title: $trans('End'),
    datetimeKey: 'end_datetime_from_last_order',
    datetimeId: 'end_datetime_from_last_order',
    datetimeLabel: $trans('Date/time from last job?'),
    dateKey: 'end_date',
    dateId: 'trip_end_date',
    dateLabel: $trans('End date'),
    datePickerClass: 'mb-2',
    timeKey: 'end_time',
    timeId: 'end_time',
    timeLabel: $trans('End time'),
    timeLabelFor: 'trip_end_time',
    timeInputClass: 'mb-2',
    locationKey: 'end_location_from_last_order',
    locationId: 'end_location_from_last_order',
    locationLabel: $trans('Location from last job?'),
    nameKey: 'end_name',
    nameId: 'trip_end_name',
    cityKey: 'end_city',
    cityId: 'trip_end_city',
    addressKey: 'end_address',
    addressId: 'trip_end_address',
    postalKey: 'end_postal',
    postalId: 'trip_end_postal',
    countryKey: 'end_country_code',
    countryId: 'end_country_code',
  }
))
</script>
