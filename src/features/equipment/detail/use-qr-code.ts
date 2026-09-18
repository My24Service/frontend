import { computed, type Ref } from 'vue'
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import {
  equipmentEquipmentCreateQrCreateMutation,
  equipmentEquipmentRetrieveQueryKey,
  equipmentLocationCreateQrCreateMutation,
  equipmentLocationRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import { $trans, errorToast } from '@/services/i18n'
import my24 from '@/services/my24'
import { useMainStore } from '@/stores/main'

/**
 * The sliver of a detail record the QR block reads: the display name, the
 * file the download names itself after, and the two URL shapes the API sends.
 * Both the equipment and the location record carry it.
 */
export interface QrRecord {
  name?: string | null
  uuid?: string
  qr_path?: string | null
  qr_url?: string | null
}

/**
 * What one QR resource differs by: the create-QR mutation, the detail query
 * key the new QR is written back into, and the download filename.
 *
 * `any` on the mutation is the same seam `useDocumentCollection` documents:
 * each resource's mutation has its own response, error and variables types,
 * and restating them here would reject exactly the factories this exists to
 * accept. The call site below is concrete, so the `any` never reaches a
 * consumer.
 */
interface QrResource {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: () => UseMutationOptions<any, any, any>
  queryKey: (id: number) => readonly unknown[]
  filename: (record: QrRecord) => string
}

const EQUIPMENT_QR: QrResource = {
  create: equipmentEquipmentCreateQrCreateMutation,
  queryKey: (id) => equipmentEquipmentRetrieveQueryKey({path: {id}}),
  filename: (record) => `${record.name} ${record.uuid}.png`,
}

const LOCATION_QR: QrResource = {
  create: equipmentLocationCreateQrCreateMutation,
  queryKey: (id) => equipmentLocationRetrieveQueryKey({path: {id}}),
  // The location serializer exposes no uuid, so the file is named from the
  // name alone - the legacy screen interpolated an undefined there.
  filename: (record) => `${record.name}.png`,
}

/**
 * The QR block the equipment and location detail pages share.
 *
 * The create-QR mutation and the retrieve query key differ per kind, so the
 * branch is resolved once here and the pages are written against one contract
 * rather than one mutation each - the same resolution
 * `useDocumentCollection` does for its `DocumentResource`.
 */
export function useQrCode({kind, id, record}: {
  kind: 'equipment' | 'location'
  id: number
  record: Ref<QrRecord | null | undefined>
}) {
  const resource = kind === 'location' ? LOCATION_QR : EQUIPMENT_QR
  const mainStore = useMainStore()
  const queryClient = useQueryClient()
  const {create} = useToast()

  const recreateQrMutation = useMutation(resource.create())

  /** The member's QR setting: `none` means this tenant has no QR codes at all. */
  const hasQr = computed(() => mainStore.getEquipmentQrType !== 'none')
  const qrUrl = computed(() => record.value?.qr_url ?? record.value?.qr_path ?? undefined)

  function download() {
    const current = record.value
    if (!current?.qr_path) return
    my24.downloadItem(current.qr_path, resource.filename(current))
  }

  async function recreateQr() {
    try {
      const result = await recreateQrMutation.mutateAsync({path: {id}})
      // Written into the detail cache rather than a local copy, so the QR
      // block and anything else reading the record stay one source.
      queryClient.setQueryData(resource.queryKey(id), (previous) =>
        previous ? {...previous, ...result} : previous)
    } catch {
      errorToast(create, $trans('Error recreating QR code'))
    }
  }

  return {hasQr, qrUrl, download, recreateQr}
}
