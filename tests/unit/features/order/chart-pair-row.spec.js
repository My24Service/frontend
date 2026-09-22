import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'

import { ChartPairRow } from '@/features/order'

const PAIR = {
  bar: { labels: ['jan', 'feb'], datasets: [{ label: 'Totals', data: [2, 1], backgroundColor: ['#111', '#222'] }] },
  pie: { labels: ['jan', 'feb'], datasets: [{ data: ['66.67', '33.33'], backgroundColor: ['#111', '#222'] }] },
}

const BarStub = { props: ['id', 'chartData', 'options'], template: '<div class="bar-stub" />' }
const PieStub = { props: ['id', 'chartData', 'options'], template: '<div class="pie-stub" />' }

function mountRow(id = 'year') {
  return mount(ChartPairRow, {
    props: { id, pair: PAIR },
    global: { stubs: { BarChart: BarStub, PieChart: PieStub, 'b-row': { template: '<div><slot /></div>' }, 'b-col': { template: '<div><slot /></div>' } } },
  })
}

describe('ChartPairRow', () => {
  test('draws the bar of counts and the pie of percentages, each with a derived id', () => {
    const wrapper = mountRow('order-types-03')

    const bar = wrapper.findComponent(BarStub)
    const pie = wrapper.findComponent(PieStub)
    expect(bar.props('id')).toBe('bar-chart-order-types-03')
    expect(pie.props('id')).toBe('pie-chart-order-types-03')
    expect(bar.props('chartData')).toEqual(PAIR.bar)
    expect(pie.props('chartData')).toEqual(PAIR.pie)
  })

  test('both charts fill their column rather than keeping the aspect ratio', () => {
    const wrapper = mountRow()

    for (const stub of [BarStub, PieStub]) {
      expect(wrapper.findComponent(stub).props('options')).toMatchObject({ responsive: true, maintainAspectRatio: false })
    }
  })

  test('the pie labels every slice with its percentage, in white', () => {
    const wrapper = mountRow()

    const { datalabels } = wrapper.findComponent(PieStub).props('options').plugins
    expect(datalabels.formatter('66.67')).toBe('66.67%')
    expect(datalabels.color).toBe('#fff')
    expect(wrapper.findComponent(BarStub).props('options').plugins).toBeUndefined()
  })
})
