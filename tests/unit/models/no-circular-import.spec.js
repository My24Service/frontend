import { describe, expect, test } from 'vitest'

// Regression test for a circular import:
//
//   models/base -> services/api -> auth/clientDriver -> stores/auth
//     -> stores/main -> utils -> models/orders/Order -> models/base
//
// Whether it resolved depended on which module the graph was entered through.
// Entering via stores/main or utils was fine; entering via models/base or
// services/my24 left BaseModel undefined by the time a subclass ran
// `class X extends BaseModel`, throwing "Class extends value undefined".
// The app entry (main.js) happened to take a safe path, which is why this never
// showed up in the browser.
//
// These imports are deliberately dynamic and inside the tests: vitest gives each
// spec file its own module registry, so each import here genuinely enters the
// graph at the module named, rather than inheriting a graph primed by a
// top-of-file import elsewhere in this file.
describe('module graph', () => {
  test('models/base can be the entry point', async () => {
    const { default: BaseModel } = await import('@/models/base')

    expect(typeof BaseModel).toBe('function')

    class Service extends BaseModel {
      url = '/x/'
    }

    expect(new Service()).toBeInstanceOf(BaseModel)
  })

  test('services/my24 can be the entry point', async () => {
    const { default: my24 } = await import('@/services/my24')

    expect(my24).toBeDefined()
    expect(typeof my24.hasAccessToModule).toBe('function')
  })

  test('a model module can be the entry point', async () => {
    const { OrderService } = await import('@/models/orders/Order')

    expect(typeof OrderService).toBe('function')
    expect(new OrderService().url).toBeTruthy()
  })

  test('services/api can be the entry point', async () => {
    const { default: client } = await import('@/services/api')

    expect(client).toBeDefined()
    expect(typeof client.get).toBe('function')
  })
})
