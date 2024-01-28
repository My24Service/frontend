import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';
const moment = require('moment')

import Dispatch from '@/views/mobile/Dispatch.vue'
import dispatchResponse from '../../fixtures/dispatch'

vi.mock('axios')

describe('Dispatch.vue', () => {
  let actions
  let store

  beforeEach(() => {
    actions = {
      getStatuscodes: () => []
    }

    store = new Vuex.Store({
      actions
    })
  })

  test('exists', async () => {
    axios.get.mockResolvedValue(dispatchResponse)

    const wrapper = shallowMount(Dispatch, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const canvas = wrapper.findComponent({ ref: 'dispatch-canvas' });
    expect(canvas.exists()).to.be.true;
  });
});
