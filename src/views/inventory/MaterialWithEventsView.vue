<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail" v-if="material && material.last_event">
      <h3>{{ material.name }} - {{ $trans('This day') }}</h3>
      <div>
        <p>{{ $trans('Status') }}:
          <span :class="getStatusClass">
            {{ material.last_event.event_type }}
          </span>
          </p>
        <div v-if="material.last_event.measure_last_event_type">
          <p>{{ $trans('Seconds since') }} {{ material.last_event.measure_last_event_type }}: {{ material.last_event.secs_since_last_measure_event_type }}</p>
        </div>
        <div>
          <div v-for="eventType in stats">
            <p><strong>{{ eventType.event_type }}</strong></p>
            <p># events: {{ eventType.num_events }}</p>
            <p v-if="eventType.sum_duration">Total duration: {{ eventType.sum_duration }}</p>
            <p v-if="eventType.avg_duration">Avg. duration: {{ eventType.avg_duration }}</p>
          </div>
        </div>
      </div>
      <b-row>
        <b-col cols="12">
        </b-col>
      </b-row>
      <footer class="modal-footer">
        <b-button @click="doorOpen" class="btn btn-info" type="button" variant="primary"
                  :disabled="material.last_event.event_type === 'door open'"
        >
          {{ $trans('Trigger door open') }}
        </b-button>
        <b-button @click="doorClose" class="btn btn-info" type="button" variant="primary"
                  :disabled="material.last_event.event_type === 'door close'"
        >
          {{ $trans('Trigger door close') }}
        </b-button>
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}
        </b-button>
      </footer>
    </div>
  </b-overlay>
</template>

<script>
import materialEventTypeModel from '../../models/inventory/MaterialEventType.js'
import materialModel from '../../models/inventory/Material.js'
import materialEventModel from '../../models/inventory/MaterialEvent.js'
import memberNewDataSocket from '../../services/websocket/MemberNewDataSocket.js'
import {NEW_DATA_EVENTS} from '../../constants';

export default {
  data() {
    return {
      isLoading: false,
      material: materialModel.getFields(),
      stats: []
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  computed: {
    getStatusClass() {
      return this.material.last_event.event_type === 'door open' ? 'open' : 'closed'
    }
  },
  methods: {
    async doorOpen() {
      await materialEventModel.sendDoorOpen(this.pk)
    },
    async doorClose() {
      await materialEventModel.sendDoorClose(this.pk)
    },
    goBack() {
      this.$router.go(-1)
    },
    async onNewData(data) {
      if (data.type === NEW_DATA_EVENTS.MATERIAL_EVENT) {
        if (data.material === this.pk) {
          this.material = await materialModel.detail(this.pk)
          this.events = await materialEventModel.getForMaterial(this.pk)
          this.stats = await materialEventTypeModel.getStatsForMaterial(this.pk)
        }
        this.newData = true
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.material = await materialModel.detail(this.pk)
        this.events = await materialEventModel.getForMaterial(this.pk)
        this.stats = await materialEventTypeModel.getStatsForMaterial(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching material/events', error)
        this.errorToast(this.$trans('Error fetching material'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
  },
  async mounted() {
    await memberNewDataSocket.init(NEW_DATA_EVENTS.MATERIAL_EVENT)
    memberNewDataSocket.setOnmessageHandler(this.onNewData)
    memberNewDataSocket.getSocket()
  },
  beforeDestroy() {
    memberNewDataSocket.removeOnmessageHandler(NEW_DATA_EVENTS.MATERIAL_EVENT)
  }
}
</script>

<style scoped>
.open {
  padding: 4px;
  color: floralwhite;
  background-color: red;
}
.closed {
  padding: 4px;
  background-color: #1e7e34;
  color: floralwhite;
}
</style>
