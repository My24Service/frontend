/**
 * What the viewer reads off a quotation: the list, view and form records all carry it.
 *
 * Lives outside QuotationPDFViewer.vue so index.ts can re-export it: plain
 * `tsc` (and Stryker's typescript checker, which runs it) sees every `.vue`
 * file through the `*.vue` shim, which has a default export and nothing else.
 */
export type ViewerQuotation = Pick<Api.Quotation, 'id' | 'quotation_id' | 'preliminary' | 'definitive_pdf_filename'>
