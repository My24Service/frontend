<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          {{ $trans("Engineer locations") }}
        </h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ActionButton icon="refresh"
              v-bind:method="refresh"
              v-bind:title="$trans('Refresh')"
            />
          </BButton-group>
        </BButton-toolbar>
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

<script setup lang="ts">
/**
 * Where the engineers are, on a HERE map.
 *
 * A maintenance-flavour dispatch feature: the nav section shows it only when
 * `profile.flavour` is `maintenance`. It was gated on a per-tenant
 * companycode blocklist before, which is the same product difference said the
 * wrong way.
 *
 * The map is the one piece of imperative, third-party state in this Slice. It
 * is built once on mount and held in refs so the resize listener can reach it;
 * the markers are a *watch* over the read, which is what makes the Refresh
 * button do something — the legacy screen fetched the locations a second time
 * and never re-plotted them.
 */

// The tenant-wide HERE key the legacy screen shipped with. It is a public
// browser key, not a secret, and moving it to configuration is a separate job.
const API_KEY = 'x60nvtHOasls2goD-j1kZiVDZkyWUwS9WTR8vwrau5Y'
const CENTER = {lat: 52.085, lng: 5.62222}

interface HereViewPort {
  resize: () => void
}

interface HereMap {
  addObject: (object: unknown) => void
  getViewPort: () => HereViewPort
}

interface HereMarker {
  setData: (data: string) => void
}

interface HereMarkerGroup {
  addObject: (marker: unknown) => void
  removeAll: () => void
  addEventListener: (
    type: string,
    handler: (event: {target: {getGeometry: () => unknown; getData: () => string}}) => void,
    capture: boolean,
  ) => void
}

interface HereUi {
  addBubble: (bubble: unknown) => void
}

interface HereLayers {
  vector: {normal: {map: unknown}}
}

interface HereApi {
  service: {Platform: new (options: {apikey: string}) => {createDefaultLayers: () => HereLayers}}
  Map: new (container: HTMLElement, layer: unknown, options: {zoom: number; center: {lat: number; lng: number}}) => HereMap
  mapevents: {Behavior: new (events: unknown) => unknown; MapEvents: new (map: unknown) => unknown}
  ui: {
    InfoBubble: new (geometry: unknown, options: {content: string}) => unknown
    UI: {createDefault: (map: unknown, layers: unknown) => HereUi}
  }
  map: {
    Marker: new (coordinate: {lat: number; lng: number}) => HereMarker
    Group: new () => HereMarkerGroup
  }
}

/** The HERE script global, which the app's index.html loads. */
function here(): HereApi | null {
  return (window as unknown as {H?: HereApi}).H ?? null
}

const hereMap = useTemplateRef<HTMLElement>('hereMap')
const map = shallowRef<HereMap | null>(null)
const markerGroup = shallowRef<HereMarkerGroup | null>(null)
const ui = shallowRef<HereUi | null>(null)

const locationsQuery = useQuery(() => ({...Api.CompanyEngineerGetLocations.list.options()}))

const locations = computed<Api.EngineerLocation[]>(() => locationsQuery.data.value ?? [])

function refresh() {
  void locationsQuery.refetch()
}

/**
 * The resize listener used to be an anonymous `addEventListener` that nothing
 * ever removed: every visit to this screen left another live listener holding a
 * dead map. `useEventListener` unregisters it when the scope is disposed.
 */
useEventListener(window, 'resize', () => map.value?.getViewPort().resize())

/**
 * Redraw the markers from whatever the read currently holds.
 *
 * `removeAll` first, so a refresh replaces the pins rather than piling a second
 * set on top of the first.
 */
function plotMarkers() {
  const H = here()
  const group = markerGroup.value

  if (!H || !group) {
    return
  }

  group.removeAll()

  for (const location of locations.value) {
    const marker = new H.map.Marker({lat: location.lat, lng: location.lon})
    marker.setData(`<div><b>${location.name}</b></div>`)
    group.addObject(marker)
  }
}

watch([markerGroup, locations], plotMarkers)

onMounted(() => {
  const H = here()
  const container = hereMap.value

  if (!H || !container) {
    return
  }

  const platform = new H.service.Platform({apikey: API_KEY})
  const layers = platform.createDefaultLayers()
  const mapInstance = new H.Map(container, layers.vector.normal.map, {zoom: 10, center: CENTER})

  map.value = mapInstance

  new H.mapevents.Behavior(new H.mapevents.MapEvents(mapInstance))
  ui.value = H.ui.UI.createDefault(mapInstance, layers)

  const group = new H.map.Group()
  mapInstance.addObject(group)

  // A tap on a marker opens its bubble, whose content is the marker's own data.
  group.addEventListener('tap', (event) => {
    const bubble = new H.ui.InfoBubble(event.target.getGeometry(), {content: event.target.getData()})
    ui.value?.addBubble(bubble)
  }, false)

  markerGroup.value = group
})
</script>
