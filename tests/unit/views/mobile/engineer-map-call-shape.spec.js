import { beforeEach, describe, expect, test, vi } from 'vitest'

import EngineerMap from '@/views/mobile/EngineerMap.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the single migrated call in EngineerMap.
//
// loadData() used to call EngineerService.getLocations() (src/models/company/
// UserEngineer.js), which GETed `${url}get_locations/` with url
// '/company/engineer/' - i.e. `/api/company/engineer/get_locations/` once the
// legacy client's baseURL is accounted for. It now calls the generated
// companyEngineerGetLocationsList whose URL is the same
// `/api/company/engineer/get_locations/`. No query, no body either way.
//
// created() and mounted()'s initializeHereMap() both call loadData(), so a
// mount issues the GET twice - both shapes are pinned below.

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

// The HERE-maps API the view drives in mounted() has no happy-dom equivalent,
// so it is stubbed with inert classes before each mount.
const HERE = {
  service: {
    Platform: class {
      createDefaultLayers() {
        return { vector: { normal: { map: {} } } }
      }
    },
  },
  Map: class {
    addObject() {}
    getViewPort() {
      return { resize() {} }
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
        return { addBubble() {} }
      },
    },
  },
  map: {
    Marker: class {
      setData() {}
    },
    Group: class {
      addObject() {}
      addEventListener() {}
    },
  },
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  window.H = HERE
})

describe('EngineerMap', () => {
  test('loads the engineer locations from the get_locations action', async () => {
    mountForm(EngineerMap)
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(2))

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/company/engineer/get_locations/',
        query: {},
        body: undefined,
      },
      {
        method: 'get',
        path: '/api/company/engineer/get_locations/',
        query: {},
        body: undefined,
      },
    ])
  })
})
