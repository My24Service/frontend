<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          {{ $trans("Engineer locations") }}
        </h3>
        <b-button-toolbar>
          <b-button-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
          </b-button-group>
        </b-button-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">
      <div class="overflow-auto">
        <div id="map">
          <div id="mapContainer" style="height:600px;width:100%" ref="hereMap"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import ButtonLinkRefresh from "@/components/ButtonLinkRefresh.vue";
import {EngineerService} from '@/models/company/UserEngineer'

export default {
  components: {
    ButtonLinkRefresh
  },
  data: () => ({
    service: new EngineerService(),
    locations: [],
    apikey: "x60nvtHOasls2goD-j1kZiVDZkyWUwS9WTR8vwrau5Y",
    center: {lat: 52.085, lng: 5.62222},
    ui: null
  }),
  async created() {
    this.locations = await this.service.getLocations()
  },
  mounted() {
    this.platform = new window.H.service.Platform({
      apikey: this.apikey
    });
    this.initializeHereMap();
  },
  methods: {
    async loadData() {
      this.locations = await this.service.getLocations()
    },
    async initializeHereMap() { // rendering map
      const mapContainer = this.$refs.hereMap;
      const H = window.H;
      // Obtain the default map types from the platform object
      var maptypes = this.platform.createDefaultLayers();

      // Instantiate (and display) a map object:
      var map = new H.Map(mapContainer, maptypes.vector.normal.map, {
        zoom: 10,
        center: this.center
        // center object { lat: 40.730610, lng: -73.935242 }
      });

      addEventListener("resize", () => map.getViewPort().resize());

      // add behavior control
      new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

      // add UI
      const ui = H.ui.UI.createDefault(map, maptypes);

      // End rendering the initial map

      await this.loadData()

      this.addInfoBubble(map, ui)
    },
    addMarkerToGroup(group, coordinate, html) {
      const marker = new H.map.Marker(coordinate);
      // add custom data to the marker
      marker.setData(html);
      group.addObject(marker);
    },
    addInfoBubble(map, ui) {
      const group = new H.map.Group();
      map.addObject(group);

      // add 'tap' event listener, that opens info bubble, to the group
      group.addEventListener('tap', function (evt) {
        // event target is the marker itself, group is a parent event target
        // for all objects that it contains
        const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
          // read custom data
          content: evt.target.getData()
        });
        // show info bubble
        ui.addBubble(bubble);
      }, false);

      this.locations.forEach((location) => {
        this.addMarkerToGroup(group, {lat: location.lat, lng: location.lon},
          `<div><b>${location.name}</b></div>`);
      })
    }
  }
}
</script>
<style scoped>

</style>
