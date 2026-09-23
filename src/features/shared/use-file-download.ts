import { downloadBlob, downloadUrl } from './file-helpers'

/**
 * Save a file the user asked for, and say so when that fails.
 *
 * `fromApi` takes a generated operation's call (pass `throwOnError: true`);
 * `fromUrl` a stored file's URL. Both resolve to whether the file was saved.
 */
export function useFileDownload() {
  const {create} = useToast()

  async function attempt(save: () => Promise<void>): Promise<boolean> {
    try {
      await save()
      return true
    } catch (error) {
      console.error('download failed', error)
      errorToast(create, $trans('Error downloading file'))
      return false
    }
  }

  return {
    fromApi: (request: () => Promise<{data: unknown}>, filename: string, mime?: string) =>
      attempt(async () => downloadBlob((await request()).data as BlobPart, filename, mime)),
    fromUrl: (url: string, filename: string) =>
      attempt(() => downloadUrl(url, filename)),
  }
}
