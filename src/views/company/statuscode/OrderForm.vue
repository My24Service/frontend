<template>
  <div class="panel">
    <h6>{{ $trans("Usage") }}</h6>
    <b-form-group
      v-if="list_type === 'order'"
      label-cols="3"
      v-bind:label="$trans('Use in dispatch')"
      label-for="statuscode_color_for_assignedorders"
      :description="$trans('Use this color for assigned orders in dispatch.')"
    >
      <b-form-checkbox
        button
        button-variant="primary"
        id="statuscode_color_for_assignedorders"
        v-model="statuscode.color_for_assignedorders"
      >
      <b-icon icon="check" v-if="statuscode.color_for_assignedorders"></b-icon>
      {{ $trans('Use in dispatch') }}
      </b-form-checkbox>
    </b-form-group>
    <b-form-group
      v-if="list_type === 'order'"
      label-cols="3"
      v-bind:label="$trans('Use as filter')"
      label-for="statuscode_as_filter"
      :description="$trans('Use this statuscode for filters in order lists.')"
    >
      <b-form-checkbox
        button
        button-variant="primary"
        id="statuscode_as_filter"
        v-model="statuscode.as_filter"
      >
        <b-icon icon="check" v-if="statuscode.as_filter"></b-icon>

        {{ $trans('Use as filter') }}
      </b-form-checkbox>
    </b-form-group>

    <h6>{{ $trans("Workflow") }}</h6>

    <b-form-group
      v-if="list_type === 'order'"
      label-cols="3"
      v-bind:label="$trans('Start order')"
      label-for="statuscode_start_order"
      :description="$trans('This statuscode marks the start of an order. This is used in the App for the start order button.')"
    >
      <b-form-checkbox
        button
        button-variant="primary"
        id="statuscode_start_order"
        v-model="statuscode.start_order"
      >
        <b-icon icon="check" v-if="statuscode.start_order"></b-icon>

        {{ $trans('Start order') }}
      </b-form-checkbox>
    </b-form-group>
    <b-form-group
      v-if="list_type === 'trip'"
      label-cols="3"
      v-bind:label="$trans('Starts trip')"
      label-for="statuscode_start_trip"
      :description="$trans('This statuscode marks the start of a trip. This is used in the App for the start trip button.')"
    >
      <b-form-checkbox
        button
        button-variant="primary"
        id="statuscode_start_trip"
        v-model="statuscode.start_trip"
      >
      <b-icon icon="check" v-if="statuscode.start_trip"></b-icon>

      {{ $trans('Starts trip') }}
      </b-form-checkbox>
    </b-form-group>

    <b-form-group
      v-if="list_type === 'order'"
      label-cols="3"
      v-bind:label="$trans('Completes order')"
      label-for="statuscode_end_order"
      :description="$trans('This statuscode marks the end of an order. This is used in the App for the end order button.')"
    >
      <b-form-checkbox
        button
        button-variant="primary"
        id="statuscode_end_order"
        v-model="statuscode.end_order"
      >
      <b-icon icon="check" v-if="statuscode.end_order"></b-icon>

      {{ $trans('Completes order') }}
      </b-form-checkbox>
    </b-form-group>
    <b-form-group
      v-if="list_type === 'trip'"
      label-cols="3"
      v-bind:label="$trans('End trip?')"
      label-for="statuscode_end_trip"
      :description="$trans('This statuscode marks the end of a trip. This is used in the App for the end trip button.')"
    >
      <b-form-checkbox
        id="statuscode_end_trip"
        v-model="statuscode.end_trip"
      >
      </b-form-checkbox>
    </b-form-group>

    <b-form-group
      v-if="list_type === 'order'"
      button
      button-variant="primary"
      label-cols="3"
      v-bind:label="$trans('After end order')"
      label-for="statuscode_after_end_order"
      :description="$trans('These statuscodes will show up as buttons in the App after the order is completed.')"
    >
      <b-form-checkbox
        button
        button-variant="primary"
        id="statuscode_after_end_order"
        v-model="statuscode.after_end_order"
      >
      <b-icon icon="check" v-if="statuscode.after_end_order"></b-icon>

      {{$trans('After end order') }}
      </b-form-checkbox>
    </b-form-group>

    <b-form-group
      v-if="list_type === 'order'"
      label-cols="3"
      v-bind:label="$trans('Re-assignable')"
      label-for="statuscode_can_be_reassigned_after_end"
      :description="$trans('When checked, the order can be re-assigned after ending it. For example after no workorder has been reported.')"
    >
      <b-form-checkbox
        button
        button-variant="primary"
        id="statuscode_can_be_reassigned_after_end"
        v-model="statuscode.can_be_reassigned_after_end"
      >
      <b-icon icon="check" v-if="statuscode.can_be_reassigned_after_end"></b-icon>

      {{ $trans('Re-assignable') }}
      </b-form-checkbox>
    </b-form-group>
  </div>
</template>
