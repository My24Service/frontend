import { getStoredToken } from '@/features/auth/token-storage'

// The leaf import is load-bearing, not stylistic. This module runs inside
// services/api's static graph (models/base -> services/api -> clientDriver
// -> here), evaluated while models/base is still initializing. Importing the
// '@/features/auth' barrel — or the store — from here re-opens that cycle:
// the barrel pulls the store, which pulls stores/main -> services/my24 ->
// models/base, and BaseModel resolves undefined ("Class extends value
// undefined"). Regression net: tests/unit/models/no-circular-import.spec.js.

export default function authHeader(): Record<string, string> {
  const token = getStoredToken()

  if (token) {
    return { Authorization: `Bearer ${token}` };
  } else {
    return {};
  }
}
