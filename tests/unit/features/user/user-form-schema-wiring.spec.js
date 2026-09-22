import { beforeEach, describe, expect, test, vi } from 'vitest'
import { computed, ref } from 'vue'

import { vStockLocation } from '@/api/valibot.gen'
import {
  ApiUserForm,
  CustomerUserForm,
  EmployeeUserForm,
  EngineerUserForm,
  PlanningUserForm,
  SalesUserForm,
  StudentUserForm,
  parseApiUserForm,
  validateApiUserForm,
  parseCustomerUserForm,
  validateCustomerUserForm,
  parseEmployeeUserForm,
  validateEmployeeUserForm,
  parseEngineerUserForm,
  validateEngineerUserForm,
  parsePlanningUserForm,
  validatePlanningUserForm,
  parseSalesUserForm,
  validateSalesUserForm,
  parseStudentUserForm,
  validateStudentUserForm,
} from '@/features/user'


import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { userRoutes } from '../../support/user-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * Every user form must hand `useUserForm` its own tested schema functions.
 *
 * The seven `validateXUserForm` / `parseXUserForm` pairs live beside their
 * screens and their spec suites exercise them directly — but nothing forced a
 * screen to *use* them, so the wrapper's hand-written validation and parsing
 * could drift from the schemas the suites pin. This spec replaces the wrapper
 * with a recorder and asserts, per screen, that the config carries the very
 * functions the schema module exports.
 *
 * It fails without that wiring (the config has no `validate`/`parse` at all)
 * and passes with it, which is the property the screens' own behaviour specs
 * cannot state.
 */

const captured = vi.hoisted(() => [])

vi.mock('@/features/user/use-user-form', () => ({
  useUserForm: (config) => {
    captured.push(config)
    return {
      values: ref(config.empty()),
      errors: ref({}),
      submitClicked: ref(false),
      probe: {
        state: ref('idle'),
        validationState: computed(() => undefined),
        waitForProbe: async () => {},
      },
      isCreate: ref(true),
      id: ref(null),
      record: ref(undefined),
      saving: ref(false),
      isLoading: ref(false),
      buttonDisabled: ref(false),
      createMutation: {},
      updateMutation: {},
      submitForm: () => {},
      cancelForm: () => {},
    }
  },
}))

const api = installApiSeam()

beforeEach(() => {
  captured.length = 0
  // The engineer screen reads the stock-location picker during setup; the
  // other six read nothing until submitted.
  api.get('/api/inventory/stock-location/', paginated([
    fixtureFor(vStockLocation, { id: 7, name: 'Depot Amsterdam' }),
  ]))
})

/** Mount one screen and return the config it handed the wrapper. */
async function configOf(component) {
  mountForm(component, {
    deep: true,
    routes: userRoutes,
    main: {
      getCountries: [{ value: 'NL', text: 'Nederland' }],
      getMemberHasBranches: false,
    },
  })
  await settle()
  expect(captured).toHaveLength(1)
  return captured[0]
}

const CASES = [
  ['sales user', SalesUserForm, validateSalesUserForm, parseSalesUserForm],
  ['planning user', PlanningUserForm, validatePlanningUserForm, parsePlanningUserForm],
  ['customer user', CustomerUserForm, validateCustomerUserForm, parseCustomerUserForm],
  ['employee user', EmployeeUserForm, validateEmployeeUserForm, parseEmployeeUserForm],
  ['engineer user', EngineerUserForm, validateEngineerUserForm, parseEngineerUserForm],
  ['student user', StudentUserForm, validateStudentUserForm, parseStudentUserForm],
  ['api user', ApiUserForm, validateApiUserForm, parseApiUserForm],
]

describe('the seven user screens parse through their schema functions', () => {
  test.each(CASES)('%s passes its own validate and parse', async (_name, component, validate, parse) => {
    const config = await configOf(component)

    expect(config.validate).toBe(validate)
    expect(config.parse).toBe(parse)
  })
})
