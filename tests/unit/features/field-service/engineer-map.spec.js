import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import EngineerMap from '@/features/field-service/dispatch/EngineerMap.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { vEngineerLocation } from '@/api/valibot.gen'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'

/**
 * Characterisation of the engineer-locations map, written against the LEGACY
 * screen before it moves into `src/features/field-service/dispatch/`.
 *
 * This absorbs `tests/unit/views/mobile/engineer-map-call-shape.spec.js`,
 * which pinned the same two facts against a client fake; the parent deletes
 * that file with the legacy view, and the seam asserts them against the
 * request that would go on the wire.
 *
 * The HERE-maps API has no happy-dom equivalent, so it is stubbed with
 * recording classes: what the spec can judge is the read the screen makes and
 * the markers it plots from it.
 */
const api = installApiSeam()

const ENDPOINT = '/api/company/engineer/get_locations/'

// Every mount attaches a window listener; leaving one behind would fire inside
// the next test and make the counts meaningless.
enableAutoUnmount(afterEach)

const resizeViewPort = vi.hoisted(() => vi.fn())

/** The marker group the screen builds, so a spec can count what it plotted. */
const plotted = vi.hoisted(() => ({ markers: [], data: [], cleared: 0 }))

const HERE = {
  service: {
    Platform: class {
      createDefaultLayers() {
        return {vector: {normal: {map: {}}}}
      }
    },
  },
  Map: class {
    addObject() {}
    getViewPort() {
      return {resize: resizeViewPort}
    }
  },
  mapevents: {
    Behavior: class {},
    MapEvents: class {},
  },
  ui: {
    InfoBubble: class {},
    UI: {
      createDefault() {
        return {addBubble() {}}
      },
    },
  },
  map: {
    Marker: class {
      constructor(coordinate) {
        this.coordinate = coordinate
      }
      setData(html) {
        this.data = html
      }
    },
    Group: class {
      constructor() {
        plotted.markers = []
        plotted.data = []
      }
      removeAll() {
        plotted.cleared += 1
        plotted.markers = []
        plotted.data = []
      }
      addObject(marker) {
        plotted.markers.push(marker.coordinate)
        plotted.data.push(marker.data)
      }
      addEventListener() {}
    },
  },
}

const location = (overrides = {}) =>
  fixtureFor(vEngineerLocation, {id: 3, name: 'Jan Jansen', lat: 52.085, lon: 5.62222, ...overrides})

beforeEach(() => {
  plotted.markers = []
  plotted.data = []
  plotted.cleared = 0
  resizeViewPort.mockClear()
  window.H = HERE

  api.get(ENDPOINT, () => [location()])
})

afterEach(() => {
  delete window.H
})

async function mountMap() {
  const wrapper = mountForm(EngineerMap, {
    main: {getCurrentLanguage: 'nl'},
  })
  await settle()
  return wrapper
}

describe('EngineerMap', () => {
  test('reads the engineer locations once', async () => {
    // The legacy screen fetched them in `created()` and again in `mounted()`
    // before it plotted; one query serves both, which is the read the markers
    // are drawn from.
    await mountMap()

    expect(api.requests()).toEqual([{method: 'get', path: ENDPOINT, query: {}, body: undefined}])
  })

  test('plots one marker per location, labelled with its name', async () => {
    await mountMap()

    expect(plotted.markers).toEqual([{lat: 52.085, lng: 5.62222}])
    expect(plotted.data[0]).toContain('Jan Jansen')
  })

  test('a refresh re-plots the markers it just re-read', async () => {
    // The legacy Refresh button fetched the locations and never re-plotted
    // them, so the pins on screen could not change.
    const wrapper = await mountMap()
    expect(plotted.markers).toHaveLength(1)

    api.get(ENDPOINT, () => [location({id: 4, name: 'Piet Pietersen', lat: 51.5, lon: 4.9})])
    wrapper.vm.refresh()
    await settle()

    expect(api.requests()).toHaveLength(2)
    // One redraw per change that reaches the group — the point is that the
    // group is cleared before it is refilled, so a refresh replaces the pins.
    expect(plotted.cleared).toBeGreaterThan(0)
    expect(plotted.data[0]).toContain('Piet Pietersen')
    expect(plotted.markers).toEqual([{lat: 51.5, lng: 4.9}])
  })

  test('forwards window resizes to the map, and stops once unmounted', async () => {
    const wrapper = await mountMap()

    window.dispatchEvent(new Event('resize'))
    expect(resizeViewPort).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    resizeViewPort.mockClear()

    window.dispatchEvent(new Event('resize'))
    expect(resizeViewPort).not.toHaveBeenCalled()
  })
})