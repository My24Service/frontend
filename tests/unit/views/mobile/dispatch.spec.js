import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';
const moment = require('moment')

import localVue from '../../index'
import Dispatch from '@/views/mobile/Dispatch.vue'
import dispatchResponse from '../../fixtures/dispatch'

jest.mock('axios')

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

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(dispatchResponse);

    const wrapper = shallowMount(Dispatch, {
      localVue,
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
