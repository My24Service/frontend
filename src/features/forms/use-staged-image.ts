import { ref, type Ref } from 'vue'
import { readAsDataUrl } from '@/features/shared/file-helpers'

/**
 * The one staging mechanism for a picked image file: read it as a data URL,
 * hold it as the upload preview, and hand it back for the caller to keep
 * (an emit, a form value) - the stored file's URL never enters the values.
 *
 * `ImageUploadField` and the company info screen's camera-icon pickers share
 * this; their layouts differ, so only the behaviour is shared.
 */
export function useStagedImage(initial: string | null = null) {
  const preview: Ref<string | null> = ref(initial)

  async function stage(file: File): Promise<string> {
    const dataUrl = await readAsDataUrl(file)
    preview.value = dataUrl
    return dataUrl
  }

  return { preview, stage }
}
