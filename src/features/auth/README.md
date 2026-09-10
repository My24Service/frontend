# The Auth Slice

Session identity and nothing else. The auth store, the one token source, the
login form and the refresh timer. Plus the two app-chrome sequences that
compose them with the bootstrap: the post-login redirect and the logout order.
This directory follows the Member Slice (`src/features/member/`, the
reference implementation): the same rules, the same testing bar. The account
slice (`src/features/account/`) owns anonymous link handling and depends
downward on this door for `LoginForm` and the store.

## Layout

```
index.ts              the one door; chrome and the account slice import only this
store.ts              useAuthStore, moved from src/stores/auth
token.ts              the one token source: one VueUse storage ref, one localStorage key
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

## The login and refresh wire

`store.login` and `store.refreshToken` call the generated `jwtTokenCreate` and
`jwtTokenRefreshCreate`. The login body carries `app: 'web'`, which the backend
reads straight off the request to choose the session expiry for non-web clients
(`source/apps/core/views.py:499-508`); the generated request schema declares
`app` now, so valibot no longer strips it on the way out.

The response boundary is the generated schema as well, but it has to be wired by
hand, and that is the trap this section exists for: **a generated operation
validates its request only.** Every op in `src/api/sdk.gen.ts` emits a
`requestValidator` and no `responseValidator`, and `src/api/runtimeConfig.ts`
adds none, so a token-less 200 would sail straight through and `authenticate`
would store `undefined` - a shell that looks logged in. Both calls therefore
pass the generated response schema (`vJwtTokenCreateResponse`,
`vJwtTokenRefreshCreateResponse`) as the op's `responseValidator`, together with
`throwOnError: true`: without it the client catches whatever a validator throws
and resolves with an error object, which would also turn a wrong-password 401
into a resolved call.

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
| 6 | Store, header, timer | The token has one source: a module-scoped VueUse ref in `token.ts` | `token-storage.ts` was a second copy the store hand-synchronised against the storage the header and timer read. One ref also carries the storage event, so a logout in another tab now lands here |
| 7 | Store | A failed storage write no longer fails a login | The write is caught by the ref and reported through `onError`. It used to throw out of `authenticate`, so a quota error showed "Error logging you in" after the API had accepted the credentials |
| 8 | Store | A token-less login or refresh response now throws | The response was typed `any`, so a missing token was stored as `undefined` — a session that looked logged in with nothing to send. Parsed at the boundary instead |
