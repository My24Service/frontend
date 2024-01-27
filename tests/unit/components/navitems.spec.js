import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import NavItems from '@/components/NavItems.vue'
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
        user: {
          is_staff: false,
          is_superuser: false,
        }
      }
    }

    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('has 2 items', async () => {
    const wrapper = shallowMount(NavItems, {
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

describe('Navitems.vue customer', () => {
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
        submodel: 'customer_user',
        user: {
          is_staff: false,
          is_superuser: false,
          customer_user: {
            customer: 1
          }
        }
      }
    }

    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('has 2 items', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('contains Orders', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('does not contain Inventory', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('does not contain members', async () => {
    const wrapper = shallowMount(NavItems, {
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

describe('Navitems.vue branch employee', () => {
  let state
  let store
  let actions
  let getters

  beforeEach(() => {
    getters = {
      getMemberHasBranches: () => true
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
        submodel: 'employee_user',
        user: {
          is_staff: false,
          is_superuser: false,
          employee_user: {
            branch: 1
          }
        }
      }
    }

    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('has 5 items', async () => {
    const wrapper = shallowMount(NavItems, {
      router,
      store,
      mocks: {
        $trans: () => {}
      }
    })

    await flushPromises()

    const navbar = wrapper.findComponent({ ref: 'nav-items' })
    expect(navbar.element.children.length).to.eq(5)
  })

  test('contains Orders', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('does not contain Inventory', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('does not contain members', async () => {
    const wrapper = shallowMount(NavItems, {
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

describe('Navitems.vue staff', () => {
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
        submodel: 'staff',
        user: {
          is_staff: true,
          is_superuser: false
        }
      }
    }

    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  test('has 8 items', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('does contain members', async () => {
    const wrapper = shallowMount(NavItems, {
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

describe('Navitems.vue superuser', () => {
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
        submodel: 'superuser',
        user: {
          is_staff: true,
          is_superuser: true
        }
      }
    }

    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  test('has 8 items', async () => {
    const wrapper = shallowMount(NavItems, {
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

  test('does contain members', async () => {
    const wrapper = shallowMount(NavItems, {
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
