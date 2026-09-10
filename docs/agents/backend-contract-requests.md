# Backend contract requests from the frontend rewrite

Four endpoints that the frontend has to work around today. Each one is a small
serializer/annotation change on this side; together they let the frontend delete
one raw-axios call, one hand-built URL and two hand-parsed responses.

Everything below was verified against this repo's source on 2026-09-10, and
against `../frontend/openapi/schema.yaml` as committed there.

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
> today's untyped `{}`. Do the same for
> `TokenRefreshSlidingSerializerDifferentToken` (`:639`) - its response is the
> refresh token and is untyped today.
>
> **4. Three serializers require fields the schema says are optional.** Each of
> these is a 500 rather than a 400 today, because the view does
> `validated_data['email']`-style lookups:
> - `apps/company/serializers.py` - the SalesUser, PlanningUser and CustomerUser
>   serializers: `email`, `first_name` and `last_name` are optional in the
>   schema (Django's `auth.User` has `blank=True`) but `create()` indexes them
>   directly. Add
>   `'email': {'required': True, 'allow_blank': False}` and the same for
>   `first_name`/`last_name` to each `extra_kwargs`.
>   **Blast radius to confirm first:** these are request contracts other clients
>   hold - the Flutter apps generate from the same schema. They must already be
>   sending all three (otherwise they are hitting the 500), but confirm before
>   merging.
> - `apps/customer/serializers.py` - `CustomerCreateSerializer`: `customer_id` is
>   nullable/blank on the model but is one of the fields in the serializer's
>   `UniqueTogetherValidator`, so a null is a hole in that constraint rather than
>   a value. **Check the data first**:
>   `Customer.objects.filter(Q(customer_id__isnull=True) | Q(customer_id='')).count()`
>   on a few tenants. If rows exist, leave the schema alone and say so; if none
>   do, add `'customer_id': {'required': True, 'allow_blank': False}` to the same
>   `extra_kwargs`, and to `CustomerSerializer` for the patch direction.
> - `apps/customer/serializers.py` - the maintenance-contract serializer:
>   `MaintenanceContract.name` is `blank=True, null=True` while every form that
>   writes it requires a name. Same data check
>   (`MaintenanceContract.objects.filter(Q(name__isnull=True) | Q(name='')).count()`),
>   same treatment if the count is zero.
>
> **Do not** change `country_code`: `TenantCountryField` already made the schema
> say it is a non-blank two-character string, and the frontend rule for it was
> deleted.
>
> **Then:** regenerate the committed schema with
> `../venv/bin/python manage.py generate_schema --include-internal --tenant <schema> --file ../../frontend/openapi/schema.yaml`,
> run the backend test suite, and report which of the four landed. The frontend
> will run `npm run codegen` afterwards and delete its workarounds.

---

## What each one unblocks on the frontend

| # | Endpoint | Frontend workaround today | After the change |
|---|---|---|---|
| 1 | `/api/company/username-exists/` | `src/features/user/use-username-probe.ts` calls `client.get('/company/username-exists/', {params: {username}})` by hand - the last raw-axios call in `src/features/`, kept as a declared exception (`src/features/member/README.md` rule 3) | Use the generated op like its twin already does (`memberCompanycodeExistsRetrieve({query: {companycode}})` in `use-company-code-probe.ts`), then delete the README exception |
| 2 | `/api/customer/export/` | `CustomerList.vue` builds the export URL itself and the spec asserts that URL at the call site, because the strict API seam rejects a request carrying an undeclared parameter | Assert the export through the seam like every other read |
| 3 | `/api/jwt-token/` (+ `refresh/`) | `src/features/auth/store.ts` posts raw axios and parses both responses with a local valibot object; the generated ops cannot be used because their body type would strip `app` | Call `jwtTokenCreate`/`jwtTokenRefreshCreate` and drop the local parse - recorded as decision 0.5 in `docs/agents/feature-refactoring-decisions.md` |
| 4 | company + customer serializers | Six hand-written form rules that exist only because the endpoints accept what the forms refuse: `requiredIdentity`-style email/first/last rules, `requiredCustomerId()`, and the maintenance-contract name rule | Delete those rules from the slice schemas; `docs/schema-strengthenings.md` lists them item by item |
