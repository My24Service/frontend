import { humanizeKey } from '@/features/forms'

/**
 * A role is a member settings key (`order_entry_status`) whose status text
 * resolves to a statuscode row. The keys a type can carry come from the
 * API (`/api/statuscode/statuscode/roles/?code_type=`); the label is the key
 * itself, made readable: `order_entry_status` becomes "Order entry status".
 */
export function roleLabel(key: string): string {
  return humanizeKey(key)
}
