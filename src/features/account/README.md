# The Account Slice

Four screens, no lists: the reset-link request form, the password-set form
(also mounted by the student-registration wrapper), the confirm wrapper and the
no-access gate, plus the `link-params.ts` parsing they share. This directory
follows the Member Slice (`src/features/member/`, the reference
implementation): the same rules, the same testing bar. Read this file for what
the Account Slice adds on top and for what it deliberately leaves out.

Converting the slice also migrated the call sites that rode the same
hand-written service from outside this folder: the student-registration verify
and reset-password wrappers, the language chooser, the catch-all route's
no-access redirect and `TokenRefresh`. They are migrated call sites rather
than slice files, and the ledger marks them as such.

## Layout

```
index.ts              the one door; the router and chrome import only this
SendResetLinkView.vue the reset-link request form
SetPasswordForm.vue   the password-set form, also mounted by student registration
ResetPasswordConfirmView.vue the confirm wrapper
NoAccessView.vue      the access gate
schemas.ts            the form schemas
link-params.ts        the emailed-link query parsing
```

`src/models/account/Account.js` is deleted. All five of its call sites moved
in the same wave, so no Shim was needed. `src/components/ResetPassword.vue`
is now `SetPasswordForm.vue`. `src/views/account/` is gone, its three
views moved. `src/router/account.js` stays and only routes the door.

No TanStack Table here. The slice has no data tables.

## Link params

The emailed links land on bare paths with user_id, timestamp and signature in
the query string. `link-params.ts` parses them from the route query into the
typed params, coercing timestamp to the number the generated schemas demand. A link
without usable params fails fast with the generic error toast and sends
nothing.

## Declared exceptions, the ledger

Every deliberate behaviour change made while converting, so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere. A row whose
Screen(s) cell says *migrated call site* is a file outside this folder; the
rest are the four screens and two modules above.

## What stays out

The slice owns anonymous link handling only. The auth store, the login form
and the refresh timer live in `src/features/auth`. The main store bootstrap,
the redirect in `TheIndex`, the nav shells, the router guard, the member and
contract data and the language chooser stay where they are. Moving any of
them here would pull session logic into a recovery slice. `NoAccessView`
renders `LoginForm` through the auth door, which is the downward direction
the layering wants.

| # | Screen(s) | Exception | Why |
|---|---|---|---|
| 1 | Set password | `timestamp` rides the wire as a number, the legacy sent the URL string | The generated request validator rejects the string before it leaves |
| 2 | Migrated call site — verify resend | `user_id` rides the wire as a number, the legacy sent the URL string | Same validator, same reason |
| 3 | Set password, and the migrated verify resend | A link without usable params sends nothing | The legacy posted nulls or `{}` at an endpoint that answered 400; same toast, one less round trip |
| 4 | Set password | The bare `my24` global read is gone | It threw ReferenceError without the global; the route query replaces it |
| 5 | Migrated call site — language chooser | The body rides as JSON `{language}`, the legacy posted FormData | The generated mutation posts JSON to the same path |
| 6 | Slice and migrated call sites | Writes go through generated mutations, CSRF per call is gone | The client interceptor attaches the token once per session |
| 7 | Migrated call site — catch-all route | Its `/no-access` route is deleted | It duplicated the account router's route and name |
| 8 | Migrated call site — TokenRefresh | Its `AccountService` import and field are deleted | Dead code, it only ever called the auth store |
| 9 | Migrated call site — chrome specs | The dialog and chooser specs drive `vm` directly where the DOM cannot | The b-modal teleports its inputs out of the wrapper, and the modal registry has no provider under test. The validation gate, wire body, toasts and ordering stay observable through `vm` plus the fake. |
