/**
 * The `Authorization` header the customer operations are generated with.
 *
 * The customer viewset's schema documents the API-user JWT as a REQUIRED
 * `Authorization` header on its create/retrieve/update/destroy operations
 * (`schema_utils.AUTH_TOKEN_PARAMETER` — documentation for the mobile API
 * users that share the viewset, not for the web app). The web app
 * authenticates by session cookie, but the generated client's request
 * validator refuses to send anything without the header, so every call site
 * of those four operations passes this.
 *
 * The value is the empty string, deliberately: it satisfies the validator,
 * and on the wire simplejwt skips an empty header (`get_raw_token` finds no
 * tokens and returns None), so session authentication proceeds untouched.
 * See `source/settings/default_settings.py` for the authenticator chain and
 * `source/apps/core/authentication.py` for `My24JWTAuthentication`.
 */
export const SESSION_AUTH_HEADER = {Authorization: ''}
