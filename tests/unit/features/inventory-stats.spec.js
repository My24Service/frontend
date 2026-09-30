import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  vCustomerMaterialTotalSalesRow,
  vCustomerTotalSalesRow,
  vMaterialStatsTable,
  vMaterialStatsTableResponse,
  vMaterialTotalSalesRow,
  vSupplier,
  vSupplierMaterialTotalSalesRow,
  vSupplierTotalSalesRow,
} from '@/api/valibot.gen'
import { InventoryStats, StatsTable } from '@/features/inventory/stats'

import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { captureDownloads, xlsxResponse } from '../support/downloads.js'
import { useRealInputDelays } from '../support/input-delays.js'
import { mountForm, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'

const api = installApiSeam()

const YEAR = new Date().getFullYear()

/**
 * The markup, minus what changes between runs: the scoped-style hashes, the
 * generated element ids and the comment nodes.
 *
 * Both screens were compared with the legacy ones on the same stubs and were
 * identical, save for the per-customer table's first heading (Customer, which
 * the legacy screen wrote as Supplier). Since then, on purpose: the chart
 * legends are catalogue msgids ("Total sales in 2026", not "Total sales in :
 * 2026"), and the stats table's search and download sit in the table kit's
 * list header, with its refresh, instead of a search modal and a blank last
 * column.
 */
const markup = (wrapper) => wrapper.html()
  .replace(/ data-v-[0-9a-f]+(="")?/g, '')
  .replace(/BootstrapVueNext__ID__[^"]*/g, 'ID')
  .replace(/<!--[^>]*-->/g, '')
  .replaceAll(String(YEAR), 'YEAR')
  .replace(/></g, '>\n<')

const gets = (path) => api.requests().filter((request) => request.method === 'get' && request.path === path)
const bodies = () => toasts().map((toast) => toast.body)

// ---------------------------------------------------------------------------

describe('InventoryStats', () => {
  const PATHS = {
    'total-material-sales': '/api/inventory/material/total_sales/',
    'total-sales-per-supplier': '/api/inventory/material/total_sales_per_supplier/',
    'total-material-sales-per-customer': '/api/inventory/material/total_sales_per_customer/',
    'total-sales-per-material-customer': '/api/inventory/material/total_sales_per_material_customer/',
    'total-sales-per-material-supplier': '/api/inventory/material/total_sales_per_supplier_per_material/',
  }

  const figures = { sum_amount: 12, sum_price_purchase: 30, sum_price_selling: 50.5, profit: 20.5, amount_perc: 60, amount_selling_perc: '40.25' }
  const materialRow = (overrides = {}) => fixtureFor(vMaterialTotalSalesRow, { ...figures, material_name: 'Bolt', ...overrides })
  const supplierRow = (overrides = {}) => fixtureFor(vSupplierTotalSalesRow, { ...figures, supplier_name: 'Acme', ...overrides })
  const customerRow = (overrides = {}) => fixtureFor(vCustomerTotalSalesRow, { ...figures, customer_name: 'Jansen', ...overrides })
  const supplierMaterialRow = (overrides = {}) => fixtureFor(vSupplierMaterialTotalSalesRow, { ...figures, supplier_name: 'Acme', material_name: 'Bolt', ...overrides })
  const customerMaterialRow = (overrides = {}) => fixtureFor(vCustomerMaterialTotalSalesRow, { ...figures, customer_name: 'Jansen', material_name: 'Bolt', ...overrides })
  const answer = (result) => ({ result, num_pages: 1 })

  /** What the chart is handed, as the stub prints it. */
  const BarChartStub = {
    props: ['chartData', 'options'],
    template: '<div class="bar-stub">{{ JSON.stringify(chartData) }}</div>',
  }
  const chart = (wrapper) => JSON.parse(wrapper.get('.bar-stub').text())

  beforeEach(() => {
    api.get(PATHS['total-material-sales'], answer([materialRow()]))
    api.get(PATHS['total-sales-per-supplier'], answer([supplierRow()]))
    api.get(PATHS['total-material-sales-per-customer'], answer([customerRow()]))
    api.get(PATHS['total-sales-per-material-customer'], answer([customerMaterialRow()]))
    api.get(PATHS['total-sales-per-material-supplier'], answer([supplierMaterialRow()]))
  })

  async function mountStats() {
    const wrapper = mountForm(InventoryStats, { deep: true, stubs: { BarChart: BarChartStub } })
    await settle()
    return wrapper
  }

  const headers = (wrapper) => wrapper.findAll('#year-table thead th').map((th) => th.text())
  async function chooseMode(wrapper, mode) {
    await wrapper.get('#graph-type').setValue(mode)
    await settle()
  }
  async function yearBack(wrapper) {
    await wrapper.get('a[title="Year back"]').trigger('click')
    await settle()
  }
  async function yearForward(wrapper) {
    await wrapper.get('a[title="Next year"]').trigger('click')
    await settle()
  }

  test('opens on total material sales for this year', async () => {
    const wrapper = await mountStats()

    expect(gets(PATHS['total-material-sales'])).toEqual([
      { method: 'get', path: PATHS['total-material-sales'], query: { year: String(YEAR) }, body: undefined },
    ])
    expect(api.requests().filter((request) => request.method === 'get')).toHaveLength(1)
    expect(wrapper.get('h3').text()).toContain(`Total sales in ${YEAR}`)
    expect(headers(wrapper)).toEqual(['Material', 'Total amount', 'Total selling', 'Total purchase', 'Profit'])
  })

  test('the markup of the first mode and of the per-customer mode', async () => {
    const wrapper = await mountStats()
    expect(markup(wrapper)).toMatchSnapshot('total material sales')

    await chooseMode(wrapper, 'total-material-sales-per-customer')
    expect(markup(wrapper)).toMatchSnapshot('per customer')
  })

  test('shows each row with its share, its prices to the cent and its profit', async () => {
    const wrapper = await mountStats()

    const cells = wrapper.get('#year-table tbody tr').findAll('td').map((td) => td.text().replace(/\s+/g, ' '))
    expect(cells).toEqual([
      'Bolt',
      '12 (60%)',
      '€ 50.50 (40.25%)',
      '€ 30.00',
      '€ 20.50',
    ])
  })

  test('draws one bar per row, labelled with its name, for the amount', async () => {
    const wrapper = await mountStats()

    expect(chart(wrapper)).toMatchObject({
      labels: ['Bolt'],
      datasets: [{ label: `Total sales in ${YEAR}`, data: [12] }],
    })
  })

  test('the graph field switches what the bars show without asking again', async () => {
    const wrapper = await mountStats()

    await wrapper.get('#graph-field input[value="profit"]').setValue()
    expect(chart(wrapper).datasets[0].data).toEqual([20.5])

    await wrapper.get('#graph-field input[value="sum_price_selling"]').setValue()
    expect(chart(wrapper).datasets[0].data).toEqual([50.5])
    expect(gets(PATHS['total-material-sales'])).toHaveLength(1)
  })

  test('offers the amount, the selling price and the profit', async () => {
    const wrapper = await mountStats()

    const labels = wrapper.findAll('#graph-field label').map((label) => label.text())
    expect(labels).toEqual(['Amount', 'Selling price', 'Profit'])
  })

  describe.each([
    ['total-sales-per-supplier', ['Supplier', 'Total amount', 'Total selling', 'Total purchase', 'Profit'], ['Acme'], 'Total sales per supplier in'],
    ['total-material-sales-per-customer', ['Customer', 'Total amount', 'Total selling', 'Total purchase', 'Profit'], ['Jansen'], 'Total sales per customer in'],
    ['total-sales-per-material-customer', ['Customer', 'Material', 'Total amount', 'Total selling', 'Total purchase', 'Profit'], ['Jansen / Bolt'], 'Total sales per customer per material in'],
    ['total-sales-per-material-supplier', ['Supplier', 'Material', 'Total amount', 'Total selling', 'Total purchase', 'Profit'], ['Acme / Bolt'], 'Total sales per supplier per material in'],
  ])('%s', (mode, columns, bars, legend) => {
    test('reads its own endpoint for the year, with its own columns, bar labels and legend', async () => {
      const wrapper = await mountStats()

      await chooseMode(wrapper, mode)

      expect(gets(PATHS[mode])).toEqual([
        { method: 'get', path: PATHS[mode], query: { year: String(YEAR) }, body: undefined },
      ])
      expect(headers(wrapper)).toEqual(columns)
      expect(chart(wrapper).labels).toEqual(bars)
      expect(chart(wrapper).datasets[0].label).toBe(`${legend} ${YEAR}`)
    })
  })

  // REGRESSION. The per-customer table headed its customer column "Supplier".
  test('the per-customer table heads its customer column Customer', async () => {
    const wrapper = await mountStats()

    await chooseMode(wrapper, 'total-material-sales-per-customer')

    expect(headers(wrapper)[0]).toBe('Customer')
    expect(headers(wrapper)).not.toContain('Supplier')
  })

  test('cuts a long name on the axis to fifteen characters', async () => {
    api.get(PATHS['total-material-sales'], answer([materialRow({ material_name: 'A very long material name' })]))
    const wrapper = await mountStats()

    expect(chart(wrapper).labels).toEqual(['A very long ma...'])
  })

  // REGRESSION. A sale on a material or supplier with no name is legal, and
  // the label cut threw on it: the catch swallowed the error and the screen
  // stayed on its spinner for good.
  test('a row with no name still renders', async () => {
    api.get(PATHS['total-material-sales'], answer([materialRow({ material_name: null }), materialRow()]))
    const wrapper = await mountStats()

    expect(wrapper.findAll('#year-table tbody tr')).toHaveLength(2)
    expect(chart(wrapper).labels).toEqual(['', 'Bolt'])
    expect(wrapper.text()).not.toContain('Loading...')
  })

  test('going back a year asks for that year and says so in the title', async () => {
    const wrapper = await mountStats()

    await yearBack(wrapper)

    expect(gets(PATHS['total-material-sales']).map((request) => request.query.year)).toEqual([String(YEAR), String(YEAR - 1)])
    expect(wrapper.get('h3').text()).toContain(`Total sales in ${YEAR - 1}`)
    expect(chart(wrapper).datasets[0].label).toBe(`Total sales in ${YEAR - 1}`)
  })

  test('going forward a year asks for that year', async () => {
    const wrapper = await mountStats()

    await yearForward(wrapper)

    expect(gets(PATHS['total-material-sales']).map((request) => request.query.year)).toEqual([String(YEAR), String(YEAR + 1)])
  })

  test('a year already seen, or a mode already seen, is not asked for again', async () => {
    const wrapper = await mountStats()
    await yearBack(wrapper)
    await yearForward(wrapper)
    await chooseMode(wrapper, 'total-sales-per-supplier')
    await chooseMode(wrapper, 'total-material-sales')

    expect(gets(PATHS['total-material-sales'])).toHaveLength(2)
    expect(gets(PATHS['total-sales-per-supplier'])).toHaveLength(1)
  })

  // REGRESSION. A year change dropped the cache of the current mode only, so
  // another mode read earlier came back with its old year's rows under the new
  // year's title.
  test('a mode read in another year is read again for the year on screen', async () => {
    const wrapper = await mountStats()
    await chooseMode(wrapper, 'total-sales-per-supplier')
    await chooseMode(wrapper, 'total-material-sales')
    await yearBack(wrapper)

    await chooseMode(wrapper, 'total-sales-per-supplier')

    expect(gets(PATHS['total-sales-per-supplier']).map((request) => request.query.year)).toEqual([String(YEAR), String(YEAR - 1)])
    expect(wrapper.get('h3').text()).toContain(`Total sales in ${YEAR - 1}`)
  })

  // REGRESSION. A failed read was logged to the console and nothing else.
  test('a failed read says so', async () => {
    api.get(PATHS['total-material-sales'], serverError)
    await mountStats()

    expect(bodies()).toEqual(['Error fetching data'])
  })

  test('a failed read of another mode says so too', async () => {
    const wrapper = await mountStats()
    api.get(PATHS['total-sales-per-supplier'], serverError)

    await chooseMode(wrapper, 'total-sales-per-supplier')

    expect(bodies()).toEqual(['Error fetching data'])
  })
})

// ---------------------------------------------------------------------------

describe('StatsTable', () => {
  const STATS = '/api/inventory/material/stats_table/'
  const EXPORT = '/api/inventory/stats_table_export/'

  const row = (overrides = {}) => fixtureFor(vMaterialStatsTable, {
    id: 4, name: 'Bolt', supplier: fixtureFor(vSupplier, { name: 'Acme' }),
    num_sales: 7, turnover: 105.5, profit: 30, margin_product: 12.345, current_stock: 40,
    sum_inventory: { 2: 25, 3: 15 },
    ...overrides,
  })
  const answer = (rows = [row()]) => fixtureFor(vMaterialStatsTableResponse, {
    results: rows,
    inventory_keys: { 2: 'Shelf A', 3: 'Shelf B' },
  })

  beforeEach(() => {
    api.get(STATS, () => answer())
  })

  async function mountStats() {
    const wrapper = mountForm(StatsTable, { deep: true })
    await settle()
    return wrapper
  }

  const statsGets = (from = 0) => api.requests().slice(from).filter((request) => request.method === 'get' && request.path === STATS)
  async function searchFor(wrapper, term) {
    await wrapper.get('header input[aria-label="Search"]').setValue(term)
    await settle()
  }

  // Legacy: 'mount loads the stats table for the current year'.
  test('opens on this year', async () => {
    const wrapper = await mountStats()

    expect(statsGets()).toEqual([
      { method: 'get', path: STATS, query: { year: String(YEAR) }, body: undefined },
    ])
    expect(wrapper.get('h3').text()).toContain(`Stats in ${YEAR}`)
  })

  test('the markup', async () => {
    const wrapper = await mountStats()

    expect(markup(wrapper)).toMatchSnapshot()
  })

  test('shows each material with its supplier, its figures and where its stock lies', async () => {
    const wrapper = await mountStats()

    const cells = wrapper.get('#stats-table tbody tr').findAll('td').map((td) => td.text().replace(/\s+/g, ' '))
    expect(cells).toEqual([
      'Acme', 'Bolt', '7', '€ 105.50', '€ 30.00', '12.35 %', '40', 'Shelf A: 25Shelf B: 15',
    ])
  })

  test('heads the columns', async () => {
    const wrapper = await mountStats()

    const headers = wrapper.findAll('#stats-table thead th').map((th) => th.text())
    expect(headers).toEqual([
      'Supplier', 'Product', 'Total sales', 'Turnover', 'Profit', 'Margin product', 'Stock', 'Locations',
    ])
  })

  // Legacy: 'nextYear reloads with the incremented year'.
  test('going forward a year reloads with that year', async () => {
    const wrapper = await mountStats()
    const start = api.requests().length

    await wrapper.get('a[title="Next year"]').trigger('click')
    await settle()

    expect(statsGets(start)).toEqual([
      { method: 'get', path: STATS, query: { year: String(YEAR + 1) }, body: undefined },
    ])
    expect(wrapper.get('h3').text()).toContain(`Stats in ${YEAR + 1}`)
  })

  test('going back a year reloads with that year', async () => {
    const wrapper = await mountStats()
    const start = api.requests().length

    await wrapper.get('a[title="Year back"]').trigger('click')
    await settle()

    expect(statsGets(start).map((request) => request.query)).toEqual([{ year: String(YEAR - 1) }])
  })

  // Legacy: 'sends the search query as q'. The search is the header's field,
  // as on every list, not the legacy modal.
  test('a search from the header field is sent as q', async () => {
    const wrapper = await mountStats()
    const start = api.requests().length

    await searchFor(wrapper, 'acme')

    expect(statsGets(start)).toEqual([
      { method: 'get', path: STATS, query: { year: String(YEAR), q: 'acme' }, body: undefined },
    ])
  })

  // Legacy: 'a cleared search drops the q parameter' and 'an untouched search
  // box does not send q at all'. The second is every test above that reads
  // `query: { year }` alone. The first cannot be asked of the wire any more:
  // the unfiltered read is the one already in the query cache, so a cleared
  // search is answered from it and nothing goes out - what is pinned is that
  // `q=''` never does, and that the unfiltered rows are back.
  test('a cleared search drops the q parameter and brings the unfiltered rows back', async () => {
    api.get(STATS, ({ query }) => (query.q ? answer([]) : answer()))
    const wrapper = await mountStats()
    await searchFor(wrapper, 'acme')
    expect(wrapper.findAll('#stats-table tbody tr td').map((td) => td.text())).not.toContain('Bolt')

    await searchFor(wrapper, '')

    expect(statsGets().some((request) => 'q' in request.query && request.query.q === '')).toBe(false)
    expect(wrapper.findAll('#stats-table tbody tr td').map((td) => td.text())).toContain('Bolt')
  })

  // The kit's list delay: nothing is asked while the user types, one read once
  // the term is at rest.
  test('the search goes out once typing comes to rest, not per keystroke', async () => {
    useRealInputDelays()
    const wrapper = await mountStats()
    const start = api.requests().length
    const field = wrapper.get('header input[aria-label="Search"]')

    await field.setValue('ac')
    await settle()
    await field.setValue('acme')
    await settle()
    expect(statsGets(start)).toEqual([])

    await new Promise((resolve) => setTimeout(resolve, 400))
    await settle()

    expect(statsGets(start).map((request) => request.query)).toEqual([{ year: String(YEAR), q: 'acme' }])
  })

  test('the header refresh reads the stats again', async () => {
    const wrapper = await mountStats()
    const start = api.requests().length

    await wrapper.get('button[title="Refresh"]').trigger('click')
    await settle()

    expect(statsGets(start).map((request) => request.query)).toEqual([{ year: String(YEAR) }])
  })

  test('the search keeps the year on screen', async () => {
    const wrapper = await mountStats()
    await wrapper.get('a[title="Year back"]').trigger('click')
    await settle()

    await searchFor(wrapper, 'acme')

    expect(statsGets().at(-1).query).toEqual({ year: String(YEAR - 1), q: 'acme' })
  })

  // REGRESSION. The search term lived on the shared `materialService`
  // singleton, so it outlived the screen: the next visit opened already
  // filtered by a term nothing on screen showed.
  test('a search does not outlive the screen', async () => {
    const first = await mountStats()
    await searchFor(first, 'acme')
    first.unmount()
    const start = api.requests().length

    await mountStats()

    expect(statsGets(start)).toEqual([
      { method: 'get', path: STATS, query: { year: String(YEAR) }, body: undefined },
    ])
  })

  // Legacy: 'exports the year and search term through the export endpoint'.
  test('exports the year and the search term through the export endpoint', async () => {
    const saved = captureDownloads()
    api.get(EXPORT, xlsxResponse)
    const wrapper = await mountStats()
    await searchFor(wrapper, 'bout & moer')
    const start = api.requests().length

    await wrapper.get('button[title="Download"]').trigger('click')
    await settle()

    expect(api.requests().slice(start).filter((request) => request.method === 'get')).toEqual([
      { method: 'get', path: EXPORT, query: { year: String(YEAR), q: 'bout & moer' }, body: undefined },
    ])
    expect(saved).toEqual(['stats_table.xlsx'])
    vi.restoreAllMocks()
  })

  test('exports without q when nothing was searched', async () => {
    captureDownloads()
    api.get(EXPORT, xlsxResponse)
    const wrapper = await mountStats()
    const start = api.requests().length

    await wrapper.get('button[title="Download"]').trigger('click')
    await settle()

    expect(api.requests().slice(start).map((request) => request.query)).toEqual([{ year: String(YEAR) }])
    vi.restoreAllMocks()
  })

  // REGRESSION. A failed read was logged to the console and nothing else.
  test('a failed read says so', async () => {
    api.get(STATS, serverError)
    await mountStats()

    expect(bodies()).toEqual(['Error fetching data'])
  })
})
