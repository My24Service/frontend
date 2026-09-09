# The Auth Slice

Session identity and nothing else. The auth store, the stored-token helpers,
the login form and the refresh timer. Plus the two app-chrome sequences that
compose them with the bootstrap: the post-login redirect and the logout order.
This directory follows the Member Slice (`src/features/member/`, the
reference implementation): the same rules, the same testing bar. The account
slice (`src/features/account/`) owns anonymous link handling and depends
downward on this door for `LoginForm` and the store.

## Layout

```
index.ts              the one door; chrome and the account slice import only this
store.ts              useAuthStore, moved from src/stores/auth
token-storage.ts      the one localStorage key the session reads and writes
LoginForm.vue         moved from src/components/LoginForm.vue
TokenRefresh.vue      moved from src/components/TokenRefresh.vue
```

`src/stores/auth/index.js` is deleted. Every importer retargeted in the same
wave, so no Shim was needed.

## The two cross-store seams

Identity arrives piggybacked on member bootstrap. There is no dedicated
session-identity endpoint on the happy path. Two calls cross the boundary,
and both are load-bearing in their order.

Seam A, auth to main reset. `store.login` posts credentials, then calls
`resetInitialDataFetched`, then stores the token. The caller runs the
bootstrap next. Pre-login data was anonymous, and `isLoggedIn` needs both the
token and the user info, so nothing may trust it before the bootstrap lands.

Seam B, main to auth fill. `mainStore.getInitialData` writes
`authStore.setUserInfo` from the initial data, then languages, member info,
contract and statuscodes, then marks the bootstrap fetched. Main never writes
the token.

## What stays out

The main store bootstrap stays in `src/stores/main`. The redirect in
`TheIndex`, the nav shells, the router guard, the member and contract data
and the language chooser stay where they are. The HTTP wiring
(`auth-header`, `clientDriver`, the api clients) stays in `src/services`: it
runs before any store exists on cold boot, and moving it re-opens the
documented import cycle. The specs pin the redirect, the logout order and
the wiring in place instead.

## Declared exceptions, the ledger

Every deliberate behaviour change made while converting, so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere.

| # | Screen(s) | Exception | Why |
|---|---|---|---|
| 1 | Store | `fetchUserInfo` is deleted | Zero callers. The bootstrap covers the same ground |
| 2 | Login | The `loginFailure` no-op and its await are deleted | Dead code. The validation it guarded always passes |
| 3 | Refresh timer | The phantom `token` argument to `refreshToken` is dropped | The action re-reads storage and ignored it |
| 4 | Store | Actions gain parameter types, state gains an `AuthState` | The `.ts` move demands them. `userInfo` reuses the generated `UserInfoResponse` instead of `any` — verified against the bootstrap response schema |
| 5 | Chrome specs | Redirect, logout and wiring specs drive stores and `vm` directly | The redirect fires in setup before spies exist, the modal teleports logout out of reach, and the harness stubs store actions |
