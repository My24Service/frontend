import { parse } from 'valibot'
import {
  teamleaderConfigRetrieveOptions,
  teamleaderProductDetailRetrieveOptions,
  teamleaderTaxRateListOptions,
  teamleaderTlProductCreateCreateMutation,
  teamleaderTlProductListListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Material, ProductList, ProductRequest, TaxRate } from '@/api/types.gen'
import { vProductRequest } from '@/api/valibot.gen'
import { useQueryErrorToast } from '@/features/forms'
import { hasAccessToModule } from '@/utils'

/**
 * The imperative surface of `TeamleaderProductChooser` this composable drives:
 * it is an Options API modal, so the form talks to it through a template ref
 * rather than props.
 */
export interface ProductChooserHandle {
  show: () => Promise<void>
  hide: () => void
  showSearchMode: () => void
}

/** A selling price the Teamleader config fixes for a kind of hours. */
export type TeamleaderHourlyRate = Pick<ProductList, 'selling_price'>

/**
 * A configured hours rate, or null when the setting is absent, blank or not a
 * number - in which case the hours panels fall back to ordinary pricing rather
 * than charging zero.
 */
export function configuredHourlyRate(value: unknown): TeamleaderHourlyRate | null {
  const isNumberLike = typeof value === 'string' || typeof value === 'number'
  if (!isNumberLike) return null
  const text = String(value).trim()
  if (text === '' || !Number.isFinite(Number(text))) return null
  return { selling_price: text }
}

/** The Teamleader product detail is untyped JSON; this is what a money field looks like in it. */
function productMoney(detail: Record<string, unknown>, key: string, currency: string): string {
  const money = detail[key]
  if (!money || typeof money !== 'object' || !('amount' in money) || !('currency' in money)) {
    throw new Error('Missing product price')
  }
  if (money.currency !== currency) throw new Error('Product currency does not match invoice currency')
  const amount = money.amount
  if ((typeof amount !== 'string' && typeof amount !== 'number') || !Number.isFinite(Number(amount))) {
    throw new Error('Invalid product price')
  }
  return String(amount)
}

/**
 * The body that links a material to an existing Teamleader product.
 *
 * Fails closed: a product without both prices in the invoice's currency, or
 * with a tax we cannot map to a rate, throws rather than linking with a guess.
 * The caller reports the failure and leaves the chooser open for a retry.
 */
export function productLinkBody(input: {
  materialId: number
  productId: string
  detail: Record<string, unknown>
  taxRates: readonly TaxRate[]
  currency: string
}): ProductRequest {
  const tax = input.detail.tax
  if (!tax || typeof tax !== 'object' || !('id' in tax)) throw new Error('Missing product tax')
  const taxRate = input.taxRates.find(rate => rate.uuid === tax.id)
  if (!taxRate) throw new Error('Unknown product tax')
  return parse(vProductRequest, {
    material: input.materialId,
    uuid: input.productId,
    purchase_price: productMoney(input.detail, 'purchase_price', input.currency),
    selling_price: productMoney(input.detail, 'selling_price', input.currency),
    tax_percentage: taxRate.rate,
  })
}

/**
 * Everything the invoice form knows about Teamleader products.
 *
 * On a Teamleader tenant the material and hours prices come from the linked
 * products and the configured rates instead of the tenant's own price fields,
 * and the Manage-prices panel swaps its Update buttons for link buttons that
 * open the product chooser. Off a Teamleader tenant nothing here runs a request
 * and `tlProducts` is null, which is what keeps the ordinary controls showing.
 *
 * The chooser stays the caller's: it is mounted where the composable is used and
 * handed in through `chooser`, because the flow drives it imperatively (search
 * mode, show, hide after a link lands).
 */
export function useTeamleaderProducts(options: {
  materials: () => readonly Material[]
  currency: string
  chooser: () => ProductChooserHandle | null | undefined
}) {
  const { create } = useToast()
  const queryClient = useQueryClient()

  const hasTeamleader = computed(() => hasAccessToModule('company', 'teamleader'))

  const configQuery = useQuery(() => ({
    ...teamleaderConfigRetrieveOptions(),
    enabled: hasTeamleader.value,
    refetchOnWindowFocus: false,
  }))
  const productsQuery = useQuery(() => ({
    ...teamleaderTlProductListListOptions({
      query: { ids: options.materials().map(material => material.id).join(',') },
    }),
    enabled: hasTeamleader.value && options.materials().length > 0,
    refetchOnWindowFocus: false,
  }))
  useQueryErrorToast(configQuery.error, $trans('Error loading Teamleader settings'))
  useQueryErrorToast(productsQuery.error, $trans('Error loading Teamleader products'))

  const isLoading = computed(() => configQuery.isLoading.value || productsQuery.isLoading.value)

  /** The linked products, or null off a Teamleader tenant. */
  const tlProducts = computed<ProductList[] | null>(() => {
    if (!hasTeamleader.value) return null
    return productsQuery.data.value ?? []
  })

  /** The configured work and travel rates, each null when unset or invalid. */
  const teamleaderHours = computed(() => {
    const config = hasTeamleader.value ? configQuery.data.value?.json_data : undefined
    return {
      work: configuredHourlyRate(config?.workhours_product_selling_price),
      travel: configuredHourlyRate(config?.travel_hours_product_selling_price),
    }
  })

  function linkedProduct(materialId: number): ProductList | undefined {
    return tlProducts.value?.find(product => product.material.id === materialId)
  }

  /** The material the chooser is open for; the chooser is keyed on it. */
  const chosenMaterial = ref<Material | null>(null)
  const linkingProduct = ref(false)
  const linkMutation = useMutation(teamleaderTlProductCreateCreateMutation())

  async function openProductChooser(material: Material) {
    chosenMaterial.value = material
    // The chooser mounts on the next tick, keyed on the material just set.
    await nextTick()
    const chooser = options.chooser()
    chooser?.showSearchMode()
    await chooser?.show()
  }

  async function refreshLinkedProducts() {
    await productsQuery.refetch({ throwOnError: true })
    options.chooser()?.hide()
  }

  /** An existing Teamleader product was picked in the chooser: link it to the chosen material. */
  async function productChosen(product: { id: string }) {
    const material = chosenMaterial.value
    if (!material || linkingProduct.value) return
    linkingProduct.value = true
    try {
      const [detail, taxes] = await Promise.all([
        queryClient.fetchQuery(teamleaderProductDetailRetrieveOptions({ query: { id: product.id } })),
        queryClient.fetchQuery(teamleaderTaxRateListOptions()),
      ])
      const body = productLinkBody({
        materialId: material.id,
        productId: product.id,
        detail,
        taxRates: taxes.results ?? [],
        currency: options.currency,
      })
      await linkMutation.mutateAsync({ body })
      await refreshLinkedProducts()
    } catch {
      errorToast(create, $trans('Error linking Teamleader product'))
    } finally {
      linkingProduct.value = false
    }
  }

  /** The chooser created and linked a new product itself; only the list needs refreshing. */
  async function productCreatedLinked() {
    try {
      await refreshLinkedProducts()
    } catch {
      errorToast(create, $trans('Error loading Teamleader products'))
    }
  }

  return {
    hasTeamleader,
    isLoading,
    tlProducts,
    teamleaderHours,
    linkedProduct,
    chosenMaterial,
    linkingProduct,
    openProductChooser,
    productChosen,
    productCreatedLinked,
  }
}
