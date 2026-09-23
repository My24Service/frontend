import { HttpResponse } from 'msw'
import { vi } from 'vitest'

/**
 * Record the files a screen saves through `downloadBlob` (a throwaway anchor
 * clicked with an object URL): the name each one is saved under, in order.
 * happy-dom neither makes object URLs nor follows a download anchor, so both
 * are stubbed; `vi.restoreAllMocks()` undoes them.
 */
export function captureDownloads() {
  const saved = []
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:captured')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    saved.push(this.download)
  })
  return saved
}

/** A spreadsheet answer for an export endpoint. */
export function xlsxResponse() {
  return new HttpResponse(new Uint8Array([80, 75, 3, 4]), {
    headers: {'Content-Type': 'application/xlsx'},
  })
}
