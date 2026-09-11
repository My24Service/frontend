import { describe, expect, test } from 'vitest'

import customerRoutes from '@/router/customer'

// Regression test for a real bug this review caught: the
// maintenance-contract edit/view routes declared `props: {'app-content': {}}`,
// so the record id in the URL never reached the form/view as `pk` — the edit
// screen always behaved as a create, and the view fetched id 0. These tests
// pin that every `:pk` route forwards its params to the component.

function findRoute(name) {
  const stack = [...customerRoutes]
  while (stack.length > 0) {
    const route = stack.pop()
    if (route.name === name) return route
    if (route.children) stack.push(...route.children)
  }
  throw new Error(`route not found: ${name}`)
}

function appContentProps(name, params) {
  const props = findRoute(name).props['app-content']
  return typeof props === 'function' ? props({ params }) : props
}

describe('maintenance-contract routes', () => {
  test('edit forwards the record id to the form', () => {
    expect(appContentProps('maintenance-contract-edit', { pk: '5' })).toMatchObject({ pk: '5' })
  })

  test('view forwards the record id to the view', () => {
    expect(appContentProps('maintenance-contract-view', { pk: '5' })).toMatchObject({ pk: '5' })
  })

  test('add passes no id, so the form stays in create mode', () => {
    expect(appContentProps('maintenance-contract-add', {})).not.toHaveProperty('pk')
  })
})

describe('customer routes', () => {
  test('edit forwards the record id to the form', () => {
    expect(appContentProps('customer-edit', { pk: '7' })).toMatchObject({ pk: '7' })
  })

  test('view forwards the record id to the view', () => {
    expect(appContentProps('customer-view', { pk: '7' })).toMatchObject({ pk: '7' })
  })
})
