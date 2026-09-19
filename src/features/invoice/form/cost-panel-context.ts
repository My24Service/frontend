import type { Customer, Engineer } from '@/api/types.gen'
import type { InvoiceLineDraft, InvoiceLineType } from './calculations'

/**
 * What every cost panel of the invoice form (hours, distance, call-out costs,
 * used materials) reads from the form and hands back to it.
 *
 * Provided once by the form instead of being repeated as the same four props
 * and two listeners on each of the six panel mounts; what genuinely varies per
 * panel (its cost type, totals, defaults, Teamleader rate) stays a prop.
 */
export interface CostPanelContext {
  /** The order the costs belong to; a panel only mounts once the bootstrap has answered. */
  readonly orderPk: Readonly<Ref<number | null | undefined>>
  /** The invoice's customer, for the "customer" rate options. */
  readonly customer: Readonly<Ref<Customer | null>>
  /** The engineers on the order, for names and the "engineer" hourly rate. */
  readonly engineers: Readonly<Ref<readonly Engineer[]>>
  /** The lines the line panel currently holds: a type already on the invoice hides "create lines". */
  readonly invoiceLines: Readonly<Ref<readonly { type?: string }[]>>
  /** A panel turned its costs into invoice lines; the form adds them to the line panel. */
  invoiceLinesCreated(lines: InvoiceLineDraft[]): void
  /** A panel removed its saved costs; the form drops the lines of that type. */
  emptyCollectionClicked(type: Exclude<InvoiceLineType, 'manual'>): void
}

const COST_PANEL: InjectionKey<CostPanelContext> = Symbol('invoice-cost-panel')

export function provideCostPanelContext(context: CostPanelContext): void {
  provide(COST_PANEL, context)
}

/** The form's context, which a cost panel cannot do without. */
export function useCostPanelContext(): CostPanelContext {
  const context = inject(COST_PANEL, null)
  if (!context) throw new Error('A cost panel must be mounted inside a provideCostPanelContext() form')
  return context
}
