export function fileListOf(event: Event | { files?: FileList } | null | undefined): FileList | [] {
  if (!event) return []
  const shaped = event as { files?: FileList; target?: { files?: FileList } }
  return shaped.files ?? shaped.target?.files ?? []
}

export function chosenFile(event: Event | { files?: FileList; detail?: { files?: FileList } } | null | undefined): File | undefined {
  const shaped = event as { files?: FileList; detail?: { files?: FileList }; target?: EventTarget | null }
  const source = shaped?.files ?? shaped?.detail?.files ?? (shaped?.target as HTMLInputElement | null)?.files
  return source?.[0]
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('Failed to read file as data URL'))
    }
    reader.onerror = () => reject(reader.error instanceof Error ? reader.error : new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/** The last path segment of a file URL: what a stored file shows as. */
export function fileNameOf(file: string | null | undefined): string {
  if (!file) return ''
  const parts = file.split('/')
  return parts[parts.length - 1]
}

/** A filename's extension, lowercased and without the dot. */
export function extensionOf(filename: string): string {
  const parts = filename.split('.')
  return parts[parts.length - 1].toLowerCase()
}

/**
 * Save a download through a throwaway anchor: object URL, click, revoke.
 * The revoke runs even when the click throws, so a blocked download cannot
 * leak the URL.
 */
export function downloadBlob(data: BlobPart, filename: string, mime = 'application/pdf'): void {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], {type: mime}))
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** The media type of the backend's spreadsheet exports. */
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Save the file at a plain URL - a stored file such as a QR image, not an API
 * operation. A response that is not ok throws, so the caller can say so
 * instead of saving an error page under the file's name.
 */
export async function downloadUrl(url: string, filename: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`)
  downloadBlob(await response.blob(), filename, response.headers.get('content-type') ?? undefined)
}

/** What the backend answers a failed PDF request with. */
export type PdfBlobError = { template_error?: string; error?: string; details?: string }

/**
 * The error body of a failed PDF request.
 *
 * A PDF request asks for a blob, so its JSON error arrives as a blob too and
 * has to be decoded; one that already came back as an object is taken as is.
 * Anything unreadable becomes the empty envelope rather than a second error.
 */
export async function decodePdfError(error: unknown): Promise<PdfBlobError> {
  const raw = (error as {response?: {data?: unknown}})?.response?.data
  if (raw instanceof Blob) {
    try {
      return JSON.parse(new TextDecoder('utf-8').decode(await raw.arrayBuffer())) as PdfBlobError
    } catch { /* fall through to the generic envelope */ }
  }
  if (raw && typeof raw === 'object') return raw
  return {error: '', details: ''}
}
