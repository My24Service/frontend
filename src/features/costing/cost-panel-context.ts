import type { InvoiceLineDraft, InvoiceLineType } from './calculations'

/**
 * What every cost panel of a form (hours, distance, call-out costs, used
 * materials) reads from the form and hands back to it.
 *
 * Provided once by the form instead of being repeated as the same props and
 * two listeners on each panel mount; what genuinely varies per panel (its cost
 * type, totals, default rate, Teamleader rate) stays a prop.
 *
 * The names are the concept, not the domain: the invoice form provides the
 * order it belongs to and the invoice-line panel it feeds, the quotation form
 * the quotation (and its chapter) and the quotation-line panel. Both call the
 * same shape.
 */
export interface CostPanelContext<TDraft = InvoiceLineDraft> {
  /**
   * The record the costs belong to - the order on the invoice form, the
   * quotation on the quotation form. A panel only mounts once the form's
   * bootstrap has answered with one.
   */
  readonly parentPk: Readonly<Ref<number | null | undefined>>
  /** The engineers on the parent, for their names. */
  readonly engineers: Readonly<Ref<readonly Api.Engineer[]>>
  /** The lines the line panel currently holds: a type already present hides "create lines". */
  readonly lines: Readonly<Ref<readonly { type?: string }[]>>
  /**
   * A panel turned its costs into lines; the form adds them to the line
   * panel. The draft is the consumer's own line shape: an invoice line, or a
   * quotation line that also carries its VAT rate and material.
   */
  linesCreated(lines: TDraft[]): void
  /** A panel removed its saved costs; the form drops the lines of that type. */
  emptyCollectionClicked(type: Exclude<InvoiceLineType, 'manual'>): void
}

const COST_PANEL: InjectionKey<CostPanelContext<unknown>> = Symbol('cost-panel')

export function provideCostPanelContext<TDraft = InvoiceLineDraft>(context: CostPanelContext<TDraft>): void {
  provide(COST_PANEL, context as CostPanelContext<unknown>)
}

/**
 * The form's context, which a cost panel cannot do without. A panel names
 * the draft type its form provides; the injection key cannot carry it.
 */
export function useCostPanelContext<TDraft = InvoiceLineDraft>(): CostPanelContext<TDraft> {
  const context = inject(COST_PANEL, null)
  if (!context) throw new Error('A cost panel must be mounted inside a provideCostPanelContext() form')
  return context
}
