import { $trans } from '@/services/i18n'
import type { FieldErrors } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import {
  vBuildingBranchCreateRequest,
  vBuildingCustomerCreateRequest,
  vPatchedBuildingRequest,
} from '@/api/valibot.gen'
import type { Building } from '@/api/types.gen'
import { ownedRecordSchemas } from '@/features/equipment/owner'

/**
 * The form's own state.
 *
 * The create body is a union - `{branch, name}` or `{customer, name}` - but the
 * form holds both slots, because which one applies is a property of the member
 * rather than of the field. The parse below resolves the union and drops the
 * slot that does not apply.
 */
export interface BuildingFormValues {
  name: string
  customer: number | null
  branch: number | null
}

export type BuildingFieldErrors = FieldErrors<keyof BuildingFormValues & string>

/** A building as the form is filled in from scratch. */
export function emptyBuilding(): BuildingFormValues {
  return {name: '', customer: null, branch: null}
}

/** The fetched record as form values: the three fields this form owns. */
export function buildingFromRecord(record: Building): BuildingFormValues {
  return {
    name: record.name,
    customer: record.customer ?? null,
    branch: record.branch ?? null,
  }
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} satisfies FieldLabels<keyof BuildingFormValues & string>

/**
 * Validation and the wire body, shared with the other owned records: the
 * generated entries under the copy above, the owner rule, and the parse
 * against this tenant's create variant or the patch body - see
 * `ownedRecordSchemas`.
 */
export const {validate: validateBuilding, parse: parseBuilding} = ownedRecordSchemas<BuildingFormValues>({
  branch: vBuildingBranchCreateRequest,
  customer: vBuildingCustomerCreateRequest,
  patch: vPatchedBuildingRequest,
  labels: FIELD_LABELS,
})
