import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import NavItems from '@/components/NavItems.vue'
import localVue from '../index'
import my24 from "@/services/my24"

const resultCertainModules = {
  'userInfo': {
    "member_contract": "company:activity,company|mobile:assigned-finished,dispatch,orders|orders:orders,orders-not-accepted"
  }
}

const routes = [{
  path: '/add/something',
  name: 'add-something'
}]

const router = new VueRouter({routes})


describe('Navitems.vue no staff & no superuser', () => {
  let state
  let store
  let actions
  let getters

  beforeEach(() => {
    getters = {
      getMemberHasBranches: () => false
    }

    actions = {
      getIsStaff: () => {
        return new Promise((resolve) => {
          resolve(false)
        })
      },
      getIsSuperuser: () => {
        return new Promise((resolve) => {
          resolve(false)
        })
      }
    }

    state = {
      memberContract: my24.getModelsFromString(resultCertainModules.userInfo.member_contract),
      userInfo: {
        is_staff: false,
        is_superuser: false,
        customer_user: null
      }
    }

    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  it('exists', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      store,
      router,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.exists()).to.be.true
  })

  it('has 2 items', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.element.children.length).to.eq(2)
  })
})

describe('Navitems.vue no customer', () => {
  let state
  let store
  let actions
  let getters

  beforeEach(() => {
    getters = {
      getMemberHasBranches: () => false
    }

    actions = {
      getIsStaff: () => {
        return new Promise((resolve) => {
          resolve(false)
        })
      },
      getIsSuperuser: () => {
        return new Promise((resolve) => {
          resolve(false)
        })
      }
    }

    state = {
      memberContract: my24.getModelsFromString(resultCertainModules.userInfo.member_contract),
      userInfo: {
        is_staff: false,
        is_superuser: false,
        customer_user: 10
      }
    }

    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  it('exists', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      store,
      router,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.exists()).to.be.true
  })

  it('has 2 items', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.element.children.length).to.eq(3)
  })

  it('contains Orders', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.html()).to.contain('/orders')
  })

  it('does not contain Inventory', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.html()).not.to.contain('/inventory')
  })

  it('does not contain members', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.html()).not.to.contain('/members')
  })
})

describe('Navitems.vue staff & superuser', () => {
  let state
  let store
  let actions
  let getters

  beforeEach(() => {
    getters = {
      getMemberHasBranches: () => false
    }

    actions = {
      getIsStaff: () => {
        return new Promise((resolve) => {
          resolve(true)
        })
      },
      getIsSuperuser: () => {
        return new Promise((resolve) => {
          resolve(true)
        })
      }
    }

    state = {
      memberContract: my24.getModelsFromString(resultCertainModules.userInfo.member_contract),
      userInfo: {
        is_staff: true,
        is_superuser: true
      }
    }

    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  it('has 8 items', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.element.children.length).to.eq(9)
  })

  it('does contain members', async () => {
    const wrapper = shallowMount(NavItems, {
      localVue,
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.html()).to.contain('/members')
  })
})
