/**
 * The one localStorage key the session reads and writes. Four places used
 * the raw string before: the store seed, the bearer header, the refresh and
 * the refresh timer. One constant means a rename touches one line.
 */
export const TOKEN_KEY = 'accessToken'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? null
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
