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
    reader.onload = (e) => resolve(String(e.target?.result))
    reader.onerror = () => reject(reader.error)
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
