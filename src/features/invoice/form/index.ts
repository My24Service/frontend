export { default as InvoiceForm } from './InvoiceForm.vue'
// The cost machinery lives in `features/costing`, shared with the quotation
// form; what this barrel re-exports is the invoice's view of it, so existing
// importers (and specs) keep reading it from here.
export {
  COST_TYPE,
  INVOICE_LINE_TYPE,
  INVOICE_LINE_OPTION,
  calculateInvoiceLine,
  hydrateInvoicePrices,
  sumInvoiceTotals,
  costAmount,
  invoiceLineType,
  costToInvoiceLine,
  createInvoiceLines,
  normalizeCostDuration,
  type CostType,
  type HoursCostType,
  type InvoiceLineType,
  type InvoiceLineOption,
  type CostAmount,
  type PriceInput,
  type InvoiceTotals,
  type CalculatedPrices,
  type InvoiceLineDraft,
} from '@/features/costing'
export {
  provideCostPanelContext,
  useCostPanelContext,
  type CostPanelContext,
} from '@/features/costing'
export {
  makeCostRow,
  useCostCollection,
  type CostRow,
  type CostCollectionSource,
  type CollectionOptions,
} from '@/features/costing'
export { useOrderCostSource } from './order-cost-source'
export { useMaterialPriceUpdates } from './use-material-prices'
export {
  configuredHourlyRate,
  productLinkBody,
  useTeamleaderProducts,
  type ProductChooserHandle,
  type TeamleaderHourlyRate,
} from './use-teamleader-products'
