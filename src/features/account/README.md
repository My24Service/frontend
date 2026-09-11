# The Account Slice

Four screens, no lists: the reset-link request form, the password-set form
(also mounted by the student-registration wrapper), the confirm wrapper and the
no-access gate, plus the `link-params.ts` parsing they share. This directory
follows the Member Slice (`src/features/member/`, the reference
implementation): the same rules, the same testing bar. Read this file for what
the Account Slice adds on top and for what it deliberately leaves out.

The same generated-mutation call sites outside this folder — the student-registration verify
and reset-password wrappers, the language chooser, the catch-all route's
no-access redirect and `TokenRefresh` — are marked as such in the ledger.

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

`src/router/account.js` only routes the door.

No TanStack Table here. The slice has no data tables.

## Link params

The emailed links land on bare paths with user_id, timestamp and signature in
the query string. `link-params.ts` parses them from the route query into the
typed params, coercing timestamp to the number the generated schemas demand. A link
without usable params fails fast with the generic error toast and sends
nothing.

## Declared exceptions, the ledger

Behaviour the Slice deliberately changed, collected so a reviewer can
tell an intended fix from a refactor bug. URLs moved nowhere. A row whose
Screen(s) cell says *call site* is a file outside this folder; the
rest are the four screens and two modules above.

## What stays out

The slice owns anonymous link handling only. The auth store, the login form
and the refresh timer live in `src/features/auth`. The main store bootstrap,
the redirect in `TheIndex`, the nav shells, the router guard, the member and
contract data and the language chooser stay where they are. `NoAccessView`
renders `LoginForm` through the auth door, which is the downward direction
the layering wants.

| Screen(s) | Exception | Why |
|---|---|---|
| Set password | `timestamp` rides the wire as a number | The generated request validator rejects the string before it leaves |
| Call site — verify resend | `user_id` rides the wire as a number | Same validator, same reason |
| Set password, and the verify resend | A link without usable params sends nothing | Same toast, one less round trip |
| Call site — language chooser | The body rides as JSON `{language}` | The generated mutation posts JSON to the same path |
| Slice and call sites | Writes go through generated mutations | The client interceptor attaches the token once per session |
