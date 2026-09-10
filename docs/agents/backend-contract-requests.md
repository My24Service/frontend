# Backend contract requests from the frontend rewrite

Three schema gaps on this side that force workarounds on the frontend. Each is a
small serializer/annotation change; together they let the frontend delete one
raw-axios call and two hand-parsed responses.

Everything below was verified against this repo's source on 2026-09-10, and
against `../frontend/openapi/schema.yaml` as committed there.

## Status: all three delivered (2026-09-10)

The backend implemented all three and the frontend has regenerated from the new
schema. Two corrections the backend's own verification produced, both folded in
below:

- **The refresh response was already typed.** The claim that
  `/api/jwt-token/refresh/` returns an untyped body was wrong - it has always
  declared `TokenRefreshSlidingSerializerDifferentToken: {token: string}`, with
  `token` required. Nothing was changed there, correctly.
- **"Do not tighten any of them" was too broad.** `email`, `first_name` and
  `last_name` were already made required on the company user serializers by
  backend commit `f5c9c034` (a bug fix: `create()` indexed `validated_data['email']`
  and a missing email was a 500, not a validation error). Only customer
  `customer_id` and maintenance-contract `name` are still nullable, and only
  those two keep their frontend rules.

The frontend half of ask 1 landed with the regenerated client:
`src/features/user/use-username-probe.ts` now calls
`companyUsernameExistsRetrieve({query: {username}})` like its company-code
twin, so the raw-axios exception recorded in the table below is gone (the
prompt quoted further down is kept as sent). The export's 200 was deliberately left as `content: {}` rather than declared
binary: the frontend downloads it through its legacy auth'd-download helper, and
inventing a media type could disturb that. Correct call - nothing to follow up.

---

## The prompt

> You are working in the My24Service Django backend (`my24service/`). Four
> endpoints are missing schema information the TypeScript client needs. Each
> change is small and none changes runtime behaviour except where stated. After
> every change, regenerate the committed schema and run the existing tests.
>
> **1. `/api/company/username-exists/` declares no query parameter.**
> `apps/company/views.py:121` (`class UsernameExists`) has
> `@extend_schema(responses={200: schema_utils.AvailabilityResponse})` and reads
> `request.GET['username']` - so a request without the parameter is a
> `MultiValueDictKeyError` (a 500), and the generated client has no query
> parameter to send it with. Its twin `MemberCompanycodeExistsView`
> (`apps/member/views.py:92`) already does this correctly. Add the same
> declaration:
>
> ```python
> @extend_schema(
>     parameters=[schema_utils.query_param('username', str, 'The username to check.', required=True)],
>     responses={200: schema_utils.AvailabilityResponse},
> )
> ```
>
> **2. `/api/customer/export/` reads `q` but does not declare it.**
> `ExportXlsCustomersView.get_queryset` (`apps/customer/views.py:46-51`) filters
> on `self.request.query_params.get('q')` across name/email/address/customer_id/
> city, while the OpenAPI entry (frontend `openapi/schema.yaml:6985`) lists no
> parameters at all. Declare it - `schema_utils.query_param('q', str, '<the fields
> it searches>', required=False)` or `schema_utils.search_param(...)` if that
> matches the other list endpoints.
>
> **3. The login and refresh schemas do not describe what they accept or
> return.** `TokenObtainSlidingSerializerDifferentToken`
> (`apps/core/views.py:471`) inherits drf-simplejwt's body, so the generated type
> is `{username, password}` - but the view reads `request.data.get('app')`
> (`apps/core/views.py:499-508`) to pick the session expiry, and echoes `app`
> back in the response. Add an optional field to the serializer
> (`app = serializers.CharField(required=False, allow_blank=True, allow_null=True)`)
> and declare the 200 response shape (a token, plus the echoed `app`) instead of
> today's `No response body`. `app` is the caller's own value echoed back (null
> when the body carried none), which is how a client knows which session expiry
> it was granted. The refresh endpoint (`TokenRefreshSlidingSerializerDifferent
> Token`, `:639`) already declares `{token: string}` and needs nothing.
>
> **Three requests in total.** A fourth was drafted here (make `email`,
> `first_name`, `last_name`, customer `customer_id` and contract `name` required)
> and has been **withdrawn**, for two different reasons:
> - the `email`/`first_name`/`last_name` half had **already been done** on the
>   backend (`f5c9c034`) and its frontend rules were retired by `d0c559f5`;
> - the `customer_id` and `name` half must stay nullable: 294 of 22,800 customers
>   carry a null or blank `customer_id` and 5 of 9 maintenance contracts on one
>   tenant carry a blank `name`. Those two keep their frontend rules, recorded
>   with the counts in `../frontend/docs/schema-strengthenings.md`.
> Do **not** tighten `customer_id` or `name`.
>
> **Then:** regenerate the committed schema with
> `../venv/bin/python manage.py generate_schema --include-internal --tenant <schema> --file ../../frontend/openapi/schema.yaml`,
> run the backend test suite, and report which of the three landed. The frontend
> will run `npm run codegen` afterwards and delete its workarounds.

---

## What each one unblocks on the frontend

| # | Endpoint | Frontend workaround today | After the change |
|---|---|---|---|
| 1 | `/api/company/username-exists/` | `src/features/user/use-username-probe.ts` calls `client.get('/company/username-exists/', {params: {username}})` by hand - the last raw-axios call in `src/features/`, kept as a declared exception (`src/features/member/README.md` rule 3) | Use the generated op like its twin already does (`memberCompanycodeExistsRetrieve({query: {companycode}})` in `use-company-code-probe.ts`), then delete the README exception |
| 2 | `/api/customer/export/` | `CustomerList.vue` builds the export URL itself and the spec asserts that URL at the call site, because the strict API seam rejects a request carrying an undeclared parameter | Assert the export through the seam like every other read |
| 3 | `/api/jwt-token/` (+ `refresh/`) | `src/features/auth/store.ts` posts raw axios and parses both responses with a local valibot object; the generated ops cannot be used because their body type would strip `app` | Call `jwtTokenCreate`/`jwtTokenRefreshCreate` and drop the local parse - recorded as decision 0.5 in `docs/agents/feature-refactoring-decisions.md` |
| - | company + customer serializers | *(withdrawn - see item 4 in the prompt)* | The eleven surviving form rules are all form-only and stay; `docs/schema-strengthenings.md` is their ledger |
