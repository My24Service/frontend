import { describe, expect, test } from 'vitest'

import UserIdentityPanel from '@/features/user/UserIdentityPanel.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'

installApiSeam()

const FIELD_MESSAGES = {
  password1: () => 'Please enter a password',
  password2: () => 'Passwords do not match',
  first_name: () => 'Please enter a first name',
  last_name: () => 'Please enter a last name',
  email: () => 'Please enter a valid email',
}

const TAKEN = () => 'Username is already in use'

function panelProps(overrides = {}) {
  return {
    idPrefix: 'salesuser',
    values: {
      username: '',
      password1: '',
      password2: '',
      first_name: '',
      last_name: '',
      email: '',
    },
    errors: {},
    submitClicked: false,
    probeState: 'idle',
    takenMessage: TAKEN,
    fieldMessages: FIELD_MESSAGES,
    ...overrides,
  }
}

async function mountPanel(props = {}) {
  const wrapper = mountForm(UserIdentityPanel, {
    deep: true,
    routes: [],
    props: panelProps(props),
  })
  await settle()
  return wrapper
}

describe('UserIdentityPanel', () => {
  test('renders the identity fields with the prefixed ids', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.get('#salesuser_username').exists()).toBe(true)
    expect(wrapper.get('#salesuser_password1').exists()).toBe(true)
    expect(wrapper.get('#salesuser_password2').exists()).toBe(true)
    expect(wrapper.get('#salesuser_first_name').exists()).toBe(true)
    expect(wrapper.get('#salesuser_last_name').exists()).toBe(true)
    expect(wrapper.get('#salesuser_email').exists()).toBe(true)
  })

  test('another prefix keeps that form’s exact ids', async () => {
    const wrapper = await mountPanel({ idPrefix: 'engineer' })

    expect(wrapper.get('#engineer_username').exists()).toBe(true)
    expect(wrapper.get('#engineer_password1').exists()).toBe(true)
    expect(wrapper.get('#engineer_first_name').exists()).toBe(true)
  })

  test('a taken probe shows the taken message when no username error owns the row', async () => {
    const wrapper = await mountPanel({ probeState: 'taken' })

    expect(wrapper.get('#salesuser_username-taken-feedback').text()).toContain(
      'Username is already in use',
    )
  })

  test('a taken probe stays quiet once the username error owns the row', async () => {
    const wrapper = await mountPanel({
      probeState: 'taken',
      errors: { username: 'Please enter a username' },
      submitClicked: true,
    })

    expect(wrapper.find('#salesuser_username-taken-feedback').exists()).toBe(false)
    expect(wrapper.text()).toContain('Please enter a username')
  })

  test('a password mismatch displays once submitted', async () => {
    const wrapper = await mountPanel({
      errors: { password2: 'Passwords do not match' },
      submitClicked: true,
    })

    expect(wrapper.text()).toContain('Passwords do not match')
  })

  test('an untouched password shows its hint, not an error', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.text()).toContain('Please enter a password')
  })

  test('api users hide the personal rows', async () => {
    const wrapper = await mountPanel({
      idPrefix: 'apiuser',
      withPersonal: false,
      values: { username: '', password1: '', password2: '' },
    })

    expect(wrapper.get('#apiuser_username').exists()).toBe(true)
    expect(wrapper.find('#apiuser_first_name').exists()).toBe(false)
    expect(wrapper.find('#apiuser_email').exists()).toBe(false)
  })
})
