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
store.ts              useAuthStore
token.ts              the one token source: one VueUse storage ref, one localStorage key
auth-levels.ts        the route guard's role policy (`getUserAuthLevel`, `hasAccessRouteAuthLevel`)
LoginForm.vue         the login form
TokenRefresh.vue      the refresh timer
```

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
hand: **a generated operation validates its request only.** Every op in `src/api/sdk.gen.ts` emits a
`requestValidator` and no `responseValidator`, and `src/api/runtimeConfig.ts`
adds none, so a token-less 200 would sail straight through and `authenticate`
would store `undefined` - a shell that looks logged in. Both calls therefore
pass the generated response schema (`vJwtTokenCreateResponse`,
`vJwtTokenRefreshCreateResponse`) as the op's `responseValidator`, together with
`throwOnError: true`: without it the client catches whatever a validator throws
and resolves with an error object, which would also turn a wrong-password 401
into a resolved call.

A refresh rebuilds the bootstrap by reloading the page. Only `login()` resets
it (`resetInitialDataFetched`), so without the reload the app would keep serving
the anonymously fetched initial data with a valid new token in storage. The
refresh path also refuses to resurrect a logged-out session: after the round
trip it bails when the token changed under it. `userInfo` is normalized to
`null` at the boundary, so an omitted bootstrap field cannot read as logged in.

The 401 handling distinguishes expiry from a bad login: the interceptor logs
out only when the failed request carried an `Authorization` header, so a
header-less login 401 reaches the form's error instead of reloading the page.

## What stays out

The main store bootstrap stays in `src/stores/main`. The redirect in
`TheIndex`, the nav shells, the router guard, the member and contract data
and the language chooser stay where they are. The HTTP wiring
(`auth-header`, `clientDriver`, the api clients) stays in `src/services`: it
runs before any store exists on cold boot, and moving it re-opens the
documented import cycle. The specs pin the redirect, the logout order and
the wiring in place instead.

## Declared exceptions, the ledger

Behaviour the Slice deliberately changed, collected so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere.

| Screen(s) | Exception | Why |
|---|---|---|
| Store, header, timer | The token has one source: a module-scoped VueUse ref in `token.ts` | One ref also carries the storage event, so a logout in another tab lands here |
| Store | A failed storage write does not fail a login | The write is caught by the ref and reported through `onError` |
| Store | A token-less login or refresh response throws | Parsed at the boundary instead of storing `undefined` |
