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
