import { useAuthToken } from '@/features/auth/token'

// The leaf import is load-bearing, not stylistic. This module runs inside
// services/api's static graph (models/base -> services/api -> clientDriver
// -> here), evaluated while models/base is still initializing. Importing the
// '@/features/auth' barrel — or the store — from here re-opens that cycle:
// the barrel pulls the store, which pulls stores/main -> services/my24 ->
// models/base, and BaseModel resolves undefined ("Class extends value
// undefined"). ./token is a leaf (it imports VueUse and nothing of ours), so
// it is the only part of the auth slice the header may reach for.
// Regression net: tests/unit/models/no-circular-import.spec.js.

export default function authHeader(): Record<string, string> {
  const token = useAuthToken().value

  if (token) {
    return { Authorization: `Bearer ${token}` };
  } else {
    return {};
  }
}
